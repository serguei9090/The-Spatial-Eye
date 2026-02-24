import asyncio
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from google.adk import Agent, Runner
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.sessions import InMemorySessionService
from google.genai import types
from loguru import logger

# Resolve the path to the root .env.local file
ENV_PATH = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(ENV_PATH)

DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"

# Configure standard logger trace
logger.remove()
logger.add(
    sys.stdout,
    level="DEBUG" if DEBUG_MODE else "INFO",
    format=(
        "<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
    ),
)

app = FastAPI(title="The Spatial Eye - Gemini Relay Backend")

import tools_config
# Initialize ADK globals (can be shared across sessions)
session_service = InMemorySessionService()
agent_model = os.getenv("NEXT_PUBLIC_GEMINI_LIVE_MODEL", "gemini-2.5-flash")


@app.get("/")
def read_root():
    return {"status": "online", "live_model": agent_model}


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket, mode: str = "spatial"):
    await websocket.accept()

    # Create a unique session per connection
    session_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # ADK requires valid identifiers (no hyphens)
    mode_clean = mode.replace("-", "_")

    import warnings
    warnings.filterwarnings('ignore', category=UserWarning, module='pydantic')

    # Register the session with the ADK SessionService before running
    await session_service.create_session(
        app_name=f"SpatialEyeApp_{mode_clean}",
        user_id=user_id,
        session_id=session_id
    )

    # Resolve Mode Configuration
    if mode == "storyteller":
        system_instruction = tools_config.STORYTELLER_SYSTEM_INSTRUCTION
        active_tools = tools_config.DIRECTOR_TOOLS
    elif mode == "it-architecture":
        system_instruction = tools_config.IT_ARCHITECTURE_SYSTEM_INSTRUCTION
        active_tools = tools_config.IT_ARCHITECTURE_TOOLS
    else:
        system_instruction = tools_config.SPATIAL_SYSTEM_INSTRUCTION
        active_tools = tools_config.SPATIAL_TOOLS

    agent = Agent(
        name=f"SpatialEye_{mode_clean}", 
        model=agent_model, 
        instruction=system_instruction,
        tools=active_tools
    )
    
    runner = Runner(
        app_name=f"SpatialEyeApp_{mode_clean}", 
        agent=agent, 
        session_service=session_service
    )

    # 1. Initialize Bidi-Streaming Config
    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=[types.Modality.AUDIO],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        session_resumption=types.SessionResumptionConfig(),
        context_window_compression=types.ContextWindowCompressionConfig(
            trigger_tokens=100000,
            sliding_window=types.SlidingWindow(target_tokens=80000)
        )
    )

    # 2. Initialize the Session-specific LiveRequestQueue
    live_request_queue = LiveRequestQueue()

    # 3. Define the Upstream Task (receives bytes from FE, sends to queue)
    async def upstream_task() -> None:
        audio_chunk_count = 0
        try:
            while True:
                data = await websocket.receive()

                if "text" in data:
                    import base64
                    import json

                    text_data = data["text"]

                    try:
                        parsed = json.loads(text_data)

                        # 1. Handle Multimodal Inputs (Audio/Video)
                        if "realtimeInput" in parsed:
                            ri = parsed["realtimeInput"]
                            
                            if "media" in ri:
                                audio_chunk_count += 1
                                if audio_chunk_count % 50 == 0:
                                    logger.debug(f"[{session_id}] Upstream: Piped {audio_chunk_count} Audio Chunks")
                                media = ri["media"]
                                raw_media = base64.b64decode(media["data"])
                                live_request_queue.send_realtime(types.Blob(
                                    mime_type=media.get("mimeType", "audio/pcm;rate=16000"),
                                    data=raw_media
                                ))

                            if "video" in ri:
                                video = ri["video"]
                                raw_video = base64.b64decode(video["data"])
                                live_request_queue.send_realtime(types.Blob(
                                    mime_type=video.get("mimeType", "image/jpeg"),
                                    data=raw_video
                                ))
                            continue
                        
                        # 2. Handle Wrapped Text (Heartbeats/Resume)
                        if "text" in parsed:
                            text_data = parsed["text"]

                    except json.JSONDecodeError:
                        pass

                    # Pure text message fallback / Heartbeat
                    if text_data.strip() == "":
                        logger.trace(f"[{session_id}] Upstream: Heartbeat Received")
                    else:
                        logger.info(f"[{session_id}] Upstream: Text Chunk -> {text_data[:50]}")
                        content = types.Content(parts=[types.Part.from_text(text=text_data)])
                        live_request_queue.send_content(content)

                elif "bytes" in data:
                    audio_chunk_count += 1
                    if audio_chunk_count % 50 == 0:
                        logger.debug(f"[{session_id}] Upstream: Received {audio_chunk_count} Core Binary Audio Bytes blocks")
                    
                    audio_blob = types.Blob(
                        mime_type="audio/pcm;rate=16000",
                        data=data["bytes"],
                    )
                    live_request_queue.send_realtime(audio_blob)
        except WebSocketDisconnect:
            logger.info(f"[{session_id}] WebSocket Client Disconnected during Upstream")
        except Exception as e:
            logger.error(f"[{session_id}] Upstream Task Error: {e}")

    # 4. Define the Downstream Task (reads Events, sends to FE)
    async def downstream_task() -> None:
        audio_down_count = 0
        processed_calls = set()
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                payload = event.model_dump_json(exclude_none=True, by_alias=True)

                import json
                try:
                    p_dict = json.loads(payload)
                    # Deduplicate function calls so we don't send overlapping triggers to the FE
                    if "content" in p_dict and "parts" in p_dict["content"]:
                        skip_payload = False
                        for part in p_dict["content"]["parts"]:
                            if "functionCall" in part:
                                call_id = part["functionCall"]["id"]
                                if call_id in processed_calls:
                                    logger.warning(f"[{session_id}] Skipping duplicate function call: {call_id}")
                                    skip_payload = True
                                    break
                                processed_calls.add(call_id)
                        if skip_payload:
                            continue
                except Exception:
                    pass

                # Sniff packet for tracing log
                if "part" in payload and "inlineData" in payload:
                    audio_down_count += 1
                    if audio_down_count % 30 == 0:
                        logger.debug(f"[{session_id}] Downstream: Delivered {audio_down_count} PCM Audio Blocks to FE")
                elif "toolCall" in payload or "functionCall" in payload:
                    logger.success(f"[{session_id}] Downstream -> Tool Invoked: {payload}")
                else:
                    # For other control messages/transcripts, log truncated payload if in DEBUG
                    if DEBUG_MODE:
                        logger.debug(f"[{session_id}] Downstream -> Payload Shift: {payload[:200]}...")

                try:
                    await websocket.send_text(payload)
                except WebSocketDisconnect:
                    logger.info(f"[{session_id}] WebSockect disconnected during Downstream send.")
                    break
                except RuntimeError as e:
                    logger.debug(f"[{session_id}] Client disconnected before payload sent: {e}")
                    break
                except Exception as e:
                    logger.error(f"[{session_id}] Error sending payload downstream: {e}")
                    break
        except Exception as run_live_error:
            logger.error(f"[{session_id}] Event Loop Failure in run_live: {run_live_error}")

    # 5. Run Concurrently & Ensure Cleanup
    logger.info(f"[{session_id}] Starting bidi-streaming session...")
    try:
        t1 = asyncio.create_task(upstream_task())
        t2 = asyncio.create_task(downstream_task())
        _, pending = await asyncio.wait([t1, t2], return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
    finally:
        live_request_queue.close()
        try:
            await session_service.delete_session(
                app_name=f"SpatialEyeApp_{mode_clean}",
                user_id=user_id,
                session_id=session_id
            )
        except Exception as e:
            logger.error(f"[{session_id}] Error cleaning up session from service: {e}")
        logger.info(f"[{session_id}] Session Cleaned Up.")
