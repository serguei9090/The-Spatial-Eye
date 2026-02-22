import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

# Resolve the path to the root .env.local file
ENV_PATH = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(ENV_PATH)

app = FastAPI(title="The Spatial Eye - Gemini Relay Backend")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "live_model": os.getenv("NEXT_PUBLIC_GEMINI_LIVE_MODEL", "Not Found"),
    }
