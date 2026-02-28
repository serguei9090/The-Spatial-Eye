"""
The Spatial Eye - Gemini Relay Backend (Refactored)

This module implements a FastAPI-based WebSocket relay between the frontend and
the Google Multimodal Live API (via the ADK). It handles multimodal streaming,
session management, and mode-specific tool configurations.
"""

import asyncio
import base64
import json
import os
import sys
import uuid
import warnings
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from google.adk import Agent, Runner
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.models.google_llm import Gemini
from google.adk.sessions import InMemorySessionService
from google.genai import Client, types
from loguru import logger

import tools_config

# Resolve the path to the root .env.local file
ENV_PATH = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(ENV_PATH)

DEBUG_MODE: bool = os.getenv("DEBUG", "false").lower() == "true"

# Suppress Pydantic user warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

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
agent_model: str = os.getenv(
    "NEXT_PUBLIC_GEMINI_LIVE_MODEL", "gemini-2.5-flash-native-audio-preview-12-2025"
)


# ---------------------------------------------------------------------------
# GeminiBeta: Forces the v1beta API version (required for native-audio tools)
# ---------------------------------------------------------------------------
# The stock ADK Gemini class creates a genai.Client WITHOUT api_version,
# which defaults to an endpoint that rejects tool calls with 1008.
# The AI Studio sandbox uses v1beta — we match that here.
# ---------------------------------------------------------------------------
class GeminiBeta(Gemini):
    """Gemini model wrapper that forces api_version='v1beta'."""

    @property
    def api_client(self) -> Client:
        if not hasattr(self, "_beta_client"):
            self._beta_client = Client(
                http_options=types.HttpOptions(
                    api_version="v1beta",
                    headers=self._tracking_headers(),
                )
            )
        return self._beta_client


@app.get("/")
def read_root() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "online", "live_model": agent_model}


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket, mode: str = "spatial") -> None:
    """
    Main WebSocket endpoint for real-time interaction with Gemini.
    """
    await websocket.accept()

    session_id: str = str(uuid.uuid4())
    user_id: str = str(uuid.uuid4())
    mode_clean: str = mode.replace("-", "_")

    await session_service.create_session(
        app_name=f"SpatialEyeApp_{mode_clean}", user_id=user_id, session_id=session_id
    )

    # Resolve Mode Configuration
    config_map = {
        "storyteller": (tools_config.STORYTELLER_SYSTEM_INSTRUCTION, tools_config.DIRECTOR_TOOLS),
        "it-architecture": (tools_config.IT_ARCHITECTURE_SYSTEM_INSTRUCTION, tools_config.IT_ARCHITECTURE_TOOLS),
        "spatial": (tools_config.SPATIAL_SYSTEM_INSTRUCTION, tools_config.SPATIAL_TOOLS),
    }
    system_instruction, active_tools = config_map.get(mode, config_map["spatial"])

    agent = Agent(
        name=f"SpatialEye_{mode_clean}",
        model=GeminiBeta(model=agent_model),
        instruction=system_instruction,
        tools=active_tools,
    )

    runner = Runner(
        app_name=f"SpatialEyeApp_{mode_clean}", agent=agent, session_service=session_service
    )

    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=[types.Modality.AUDIO],
        media_resolution="MEDIA_RESOLUTION_MEDIUM",
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Puck")
            )
        ),
        context_window_compression=types.ContextWindowCompressionConfig(
            trigger_tokens=104857,
            sliding_window=types.SlidingWindow(target_tokens=52428),
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
    )

    live_request_queue = LiveRequestQueue()

    async def upstream_task() -> None:
        """Handles incoming messages from the frontend."""
        counts = {"audio": 0, "video": 0}
        try:
            while True:
                msg: dict[str, Any] = await websocket.receive()

                # Handle ASGI disconnect message
                if msg["type"] == "websocket.disconnect":
                    logger.info(f"[{session_id}] Upstream: Disconnect message received.")
                    break

                # 1. Handle Binary Audio (Direct bytes from FE)
                if "bytes" in msg:
                    counts["audio"] += 1
                    if counts["audio"] % 100 == 0:
                        logger.debug(f"[{session_id}] Upstream: {counts['audio']} Binary Blocks")
                    live_request_queue.send_realtime(
                        types.Blob(mime_type="audio/pcm;rate=16000", data=msg["bytes"])
                    )
                    continue

                # 2. Handle Text (JSON payloads)
                if "text" in msg:
                    text_data: str = msg["text"]
                    if not text_data.strip():
                        continue

                    try:
                        parsed: dict[str, Any] = json.loads(text_data)
                        
                        # Process Multimodal Payload
                        if "realtimeInput" in parsed:
                            ri = parsed["realtimeInput"]
                            media = ri.get("media")
                            video = ri.get("video")

                            if media:
                                counts["audio"] += 1
                                raw_media = base64.b64decode(media["data"])
                                live_request_queue.send_realtime(
                                    types.Blob(
                                        mime_type=media.get("mimeType", "audio/pcm;rate=16000"),
                                        data=raw_media
                                    )
                                )

                            if video:
                                counts["video"] += 1
                                if counts["video"] % 20 == 0:
                                    logger.debug(f"[{session_id}] Upstream: {counts['video']} Frames")
                                raw_video = base64.b64decode(video["data"])
                                live_request_queue.send_realtime(
                                    types.Blob(mime_type=video.get("mimeType", "image/jpeg"), data=raw_video)
                                )
                            continue

                        # Process Explicit Text Input
                        input_text = parsed.get("text")
                        if input_text:
                            logger.info(f"[{session_id}] Upstream: Text -> {input_text[:50]}")
                            live_request_queue.send_content(
                                types.Content(parts=[types.Part.from_text(text=input_text)])
                            )

                    except json.JSONDecodeError:
                        # Fallback for raw non-JSON text
                        logger.info(f"[{session_id}] Upstream: Raw Text -> {text_data[:50]}")
                        live_request_queue.send_content(
                            types.Content(parts=[types.Part.from_text(text=text_data)])
                        )
                    except Exception as e:
                        logger.error(f"[{session_id}] Upstream Message Error: {e}")

        except WebSocketDisconnect:
            logger.info(f"[{session_id}] WebSocket Disconnected (Upstream)")
        except Exception as e:
            logger.error(f"[{session_id}] Upstream Fatal Error: {e}")

    async def downstream_task() -> None:
        """Reads events from the Gemini Runner and pipes them to the frontend."""
        processed_calls: set[str] = set()
        audio_out_count = 0
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                # Optimization: model_dump_json is expensive; minimize calls
                payload: str = event.model_dump_json(exclude_none=True, by_alias=True)

                # Deduplication & Tracing
                try:
                    p_dict: dict[str, Any] = json.loads(payload)
                    
                    # 1. Filter duplicate tool calls
                    if "content" in p_dict and "parts" in p_dict["content"]:
                        is_duplicate = False
                        for part in p_dict["content"]["parts"]:
                            if "functionCall" in part:
                                fc = part["functionCall"]
                                call_id = fc["id"]
                                call_name = fc["name"]
                                call_args = fc.get("args", {})
                                
                                logger.success(f"[{session_id}] Tool Call Sent -> {call_name}({call_args})")

                                if call_id in processed_calls:
                                    is_duplicate = True
                                    break
                                processed_calls.add(call_id)
                        if is_duplicate:
                            continue

                    # 2. Progress Logging
                    if "serverContent" in p_dict and "modelTurn" in p_dict["serverContent"]:
                        parts = p_dict["serverContent"]["modelTurn"].get("parts", [])
                        for part in parts:
                            if "inlineData" in part:
                                audio_out_count += 1
                                if audio_out_count % 50 == 0:
                                    logger.debug(f"[{session_id}] Downstream: {audio_out_count} Audio Blocks")

                except Exception:
                    pass

                await websocket.send_text(payload)

        except WebSocketDisconnect:
            logger.info(f"[{session_id}] WebSocket Disconnected (Downstream)")
        except Exception as e:
            logger.error(f"[{session_id}] Downstream Fatal Error: {e}")

    # Orchestration
    logger.info(f"[{session_id}] Starting relay for mode: {mode}")
    try:
        t1 = asyncio.create_task(upstream_task())
        t2 = asyncio.create_task(downstream_task())
        # Wait for EITHER task to finish (usually due to disconnect/error).
        # Then cancel the other to prevent it from blocking cleanup.
        _, pending = await asyncio.wait([t1, t2], return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
    finally:
        live_request_queue.close()
        try:
            await session_service.delete_session(
                app_name=f"SpatialEyeApp_{mode_clean}", user_id=user_id, session_id=session_id
            )
        except Exception:
            pass
        logger.info(f"[{session_id}] Relay Terminated & Cleaned Up.")
