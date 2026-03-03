"""
Frame Diagnostics Module

Captures video frames and annotates them with bounding boxes from Gemini tool calls.
This helps isolate whether coordinate drift is caused by:
  A) Gemini returning wrong coordinates for the frame it analyzed, or
  B) Frontend math incorrectly scaling those coordinates to the screen.

Usage:
  1. Set SPATIAL_DIAGNOSTICS=true in .env.local
  2. Start the backend: bun run backend:dev
  3. Run a spatial session — frames will be saved to backend/diagnostics/
  4. Check the annotated images to see if Gemini's boxes match the actual objects.
"""

import base64
import io
import os
import time
from pathlib import Path
from typing import Any

from loguru import logger

# Only import PIL when diagnostics are enabled
DIAGNOSTICS_ENABLED = os.getenv("SPATIAL_DIAGNOSTICS", "false").lower() == "true"

if DIAGNOSTICS_ENABLED:
    from PIL import Image, ImageDraw, ImageFont


# Diagnostics output directory
DIAG_DIR = Path(__file__).resolve().parent / "diagnostics"


class FrameDiagnostics:
    """Stores the latest video frame and annotates it with tool call bounding boxes."""

    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        self._latest_frame_bytes: bytes | None = None
        self._latest_frame_dims: tuple[int, int] = (0, 0)
        self._frame_counter = 0
        self._tool_counter = 0

        if DIAGNOSTICS_ENABLED:
            self._session_dir = DIAG_DIR / session_id
            self._session_dir.mkdir(parents=True, exist_ok=True)
            logger.info(
                f"[{session_id}] 🔬 Frame Diagnostics ENABLED → {self._session_dir}"
            )

    def capture_frame(self, raw_jpeg_bytes: bytes, width: int = 0, height: int = 0) -> None:
        """Store the most recently received video frame."""
        if not DIAGNOSTICS_ENABLED:
            return

        self._latest_frame_bytes = raw_jpeg_bytes
        self._frame_counter += 1

        # Decode dimensions from JPEG if not provided
        if width == 0 or height == 0:
            try:
                img = Image.open(io.BytesIO(raw_jpeg_bytes))
                width, height = img.size
            except Exception:
                pass

        self._latest_frame_dims = (width, height)

        # Save every 20th raw frame as a reference
        if self._frame_counter % 20 == 0:
            self._save_raw_frame()

    def annotate_tool_call(self, tool_name: str, tool_args: dict[str, Any]) -> None:
        """When a track_and_highlight call is received, draw its box on the latest frame."""
        if not DIAGNOSTICS_ENABLED:
            return

        if tool_name != "track_and_highlight":
            return

        if not self._latest_frame_bytes:
            logger.warning(f"[{self.session_id}] Diagnostics: No frame available for annotation.")
            return

        box_2d = tool_args.get("box_2d", [])
        label = tool_args.get("label", "unknown")

        if len(box_2d) != 4:
            return

        self._tool_counter += 1

        try:
            img = Image.open(io.BytesIO(self._latest_frame_bytes))
            img_w, img_h = img.size
            draw = ImageDraw.Draw(img)

            ymin, xmin, ymax, xmax = box_2d

            # Method A: Direct mapping (0-1000 → frame pixels)
            px_xmin_direct = (xmin / 1000) * img_w
            px_xmax_direct = (xmax / 1000) * img_w
            px_ymin_direct = (ymin / 1000) * img_h
            px_ymax_direct = (ymax / 1000) * img_h

            # Method B: Square-padded mapping (if Gemini uses 1024x1024 internal processing)
            aspect = img_w / img_h
            if aspect > 1:  # Landscape
                pad_top = (1000 - 1000 / aspect) / 2
                pad_bottom = 1000 - pad_top
                unpad_y_min = max(0, (ymin - pad_top) / (pad_bottom - pad_top)) * img_h
                unpad_y_max = max(0, (ymax - pad_top) / (pad_bottom - pad_top)) * img_h
                unpad_x_min = (xmin / 1000) * img_w
                unpad_x_max = (xmax / 1000) * img_w
            else:  # Portrait
                pad_left = (1000 - 1000 * aspect) / 2
                pad_right = 1000 - pad_left
                unpad_x_min = max(0, (xmin - pad_left) / (pad_right - pad_left)) * img_w
                unpad_x_max = max(0, (xmax - pad_left) / (pad_right - pad_left)) * img_w
                unpad_y_min = (ymin / 1000) * img_h
                unpad_y_max = (ymax / 1000) * img_h

            # Draw Method A: GREEN (Direct mapping)
            draw.rectangle(
                [px_xmin_direct, px_ymin_direct, px_xmax_direct, px_ymax_direct],
                outline="lime",
                width=5,
            )
            draw.text(
                (px_xmin_direct, px_ymin_direct - 25),
                f"DIRECT: {label}",
                fill="lime",
            )

            # Draw Method B: RED (Square-padded mapping)
            draw.rectangle(
                [unpad_x_min, unpad_y_min, unpad_x_min + 1, unpad_y_min + 1], # Small marker at corner
                outline="red",
                width=8,
            )
            draw.rectangle(
                [unpad_x_min, unpad_y_min, unpad_x_max, unpad_y_max],
                outline="red",
                width=5,
            )
            draw.text(
                (unpad_x_min, unpad_y_max + 10),
                f"UNPAD: {label}",
                fill="red",
            )

            # Add metadata text
            draw.text(
                (10, 10),
                f"Frame: {img_w}x{img_h} | RAW: [{ymin},{xmin},{ymax},{xmax}]",
                fill="yellow",
            )
            draw.text(
                (10, 40),
                f"GREEN=direct(0-1000→{img_w}x{img_h})  RED=unpadded(square→rect)",
                fill="yellow",
            )

            # Save annotated frame
            filename = f"tool_{self._tool_counter:03d}_{label.replace(' ', '_')}.png"
            filepath = self._session_dir / filename
            img.save(filepath, "PNG")

            logger.info(
                f"[{self.session_id}] 🔬 Saved annotated frame → {filepath.name} "
                f"(GREEN=direct [{px_xmin_direct:.0f},{px_ymin_direct:.0f},"
                f"{px_xmax_direct:.0f},{px_ymax_direct:.0f}] "
                f"RED=unpad [{unpad_x_min:.0f},{unpad_y_min:.0f},"
                f"{unpad_x_max:.0f},{unpad_y_max:.0f}])"
            )

        except Exception as e:
            logger.error(f"[{self.session_id}] Diagnostics annotation error: {e}")

    def _save_raw_frame(self) -> None:
        """Save a raw frame without annotations for reference."""
        if not self._latest_frame_bytes:
            return
        try:
            filename = f"raw_{self._frame_counter:04d}.jpg"
            filepath = self._session_dir / filename
            filepath.write_bytes(self._latest_frame_bytes)
        except Exception as e:
            logger.error(f"[{self.session_id}] Diagnostics raw save error: {e}")
