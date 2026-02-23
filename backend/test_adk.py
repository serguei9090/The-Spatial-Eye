import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import uuid
from google.adk import Agent, Runner
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.sessions import InMemorySessionService
from google.genai import types
from tools_config import SPATIAL_SYSTEM_INSTRUCTION, SPATIAL_TOOLS
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local"))

async def test_run():
    session_service = InMemorySessionService()
    user_id = "test-user"
    session_id = "test-session"
    
    await session_service.create_session(
        app_name="TestApp",
        user_id=user_id,
        session_id=session_id
    )
    
    agent = Agent(
        name="TestAgent",
        model="gemini-2.5-flash-native-audio-preview-12-2025",
        instruction=SPATIAL_SYSTEM_INSTRUCTION,
        tools=SPATIAL_TOOLS
    )
    
    runner = Runner(
        app_name="TestApp",
        agent=agent,
        session_service=session_service
    )
    
    live_request_queue = LiveRequestQueue()
    content = types.Content(parts=[types.Part.from_text(text="Track and highlight my head")])
    live_request_queue.send_content(content)
    
    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=[types.Modality.AUDIO],
    )
    
    async def downstream():
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                payload = event.model_dump_json(exclude_none=True, by_alias=True)
                print(f"Yields: {payload}")
        except Exception as e:
            print("Exception:", e)
            
    async def closer():
        await asyncio.sleep(5)
        live_request_queue.close()
        
    await asyncio.gather(downstream(), closer())

if __name__ == "__main__":
    asyncio.run(test_run())
