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

# Initialize ADK globals (can be shared across sessions)
session_service = InMemorySessionService()
agent_model = os.getenv("NEXT_PUBLIC_GEMINI_LIVE_MODEL", "gemini-2.5-flash")
agent = Agent(name="SpatialEye", model=agent_model)
runner = Runner(app_name="SpatialEyeApp", agent=agent, session_service=session_service)


@app.get("/")
def read_root():
    return {"status": "online", "live_model": agent_model}


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Create a unique session per connection
    session_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())

    import warnings
    warnings.filterwarnings('ignore', category=UserWarning, module='pydantic')

    # Register the session with the ADK SessionService before running
    await session_service.create_session(
        app_name="SpatialEyeApp",
        user_id=user_id,
        session_id=session_id
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

                        # Handle old React format
                        if "realtimeInput" in parsed and "media" in parsed["realtimeInput"]:
                            audio_chunk_count += 1
                            if audio_chunk_count % 50 == 0:
                                logger.debug(
                                    f"[{session_id}] Upstream: Piped {audio_chunk_count} Audio "
                                    "Chunks to ADK"
                                )
                            media = parsed["realtimeInput"]["media"]

                            try:
                                raw_media = base64.b64decode(media["data"])
                                mime_type = media.get("mimeType", "audio/pcm;rate=16000")
                                live_blob = types.Blob(
                                    mime_type=mime_type,
                                    data=raw_media
                                )
                                live_request_queue.send_realtime(live_blob)
                            except Exception as e:
                                logger.error(f"[{session_id}] Failed to decode B64 media: {e}")
                            continue
                    except json.JSONDecodeError:
                        pass

                    # Pure text message fallback / Heartbeat
                    if text_data.strip() == "":
                        logger.trace(f"[{session_id}] Upstream: Heartbeat Received")
                    else:
                        logger.info(f"[{session_id}] Upstream: Text Chunk -> {text_data[:50]}...")
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

    # 4. Define the Downstream Task (reads Events, sends to FE)
    async def downstream_task() -> None:
        audio_down_count = 0
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                payload = event.model_dump_json(exclude_none=True, by_alias=True)

                # Sniff packet for tracing log
                if "part" in payload and "inlineData" in payload:
                    audio_down_count += 1
                    if audio_down_count % 30 == 0:
                        logger.debug(
                            f"[{session_id}] Downstream: Delivered {audio_down_count} PCM Audio "
                            "Blocks to FE"
                        )
                elif "toolCall" in payload:
                    logger.success(f"[{session_id}] Downstream -> Tool Invoked")
                else:
                    logger.debug(f"[{session_id}] Downstream -> Payload Shift (Text/Control)")

                try:
                    await websocket.send_text(payload)
                except Exception as e:
                    logger.error(f"[{session_id}] Error sending payload downstream: {e}")
                    break
        except Exception as run_live_error:
            logger.error(f"[{session_id}] Event Loop Failure in run_live: {run_live_error}")

    # 5. Run Concurrently & Ensure Cleanup
    logger.info(f"[{session_id}] Starting bidi-streaming session...")
    try:
        await asyncio.gather(upstream_task(), downstream_task(), return_exceptions=True)
    finally:
        live_request_queue.close()
        try:
            await session_service.delete_session(
                app_name="SpatialEyeApp",
                user_id=user_id,
                session_id=session_id
            )
        except Exception as e:
            logger.error(f"[{session_id}] Error cleaning up session from service: {e}")
        logger.info(f"[{session_id}] Session Cleaned Up.")
