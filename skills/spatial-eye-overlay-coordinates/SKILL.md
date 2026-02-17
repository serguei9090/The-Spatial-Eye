---
name: spatial-eye-overlay-coordinates
description: Build and troubleshoot Spatial Eye SVG overlay rendering from normalized model coordinates, including coordinate validation, pixel conversion, responsive layout behavior, and Framer Motion highlight animation. Use when editing spatial overlay components, coordinate utilities, or related tests.
---

# Spatial Eye Overlay Coordinates

Load `references/coordinate-rules.md` before touching conversion logic.

## Workflow

1. Validate incoming detection data:
- Accept only `[ymin, xmin, ymax, xmax]`.
- Reject coordinates outside 0-1000.
- Ignore boxes where `ymax <= ymin` or `xmax <= xmin`.
2. Convert normalized coordinates to pixels using current video dimensions:
- `top = (ymin / 1000) * videoHeight`
- `left = (xmin / 1000) * videoWidth`
- `bottom = (ymax / 1000) * videoHeight`
- `right = (xmax / 1000) * videoWidth`
3. Render overlays with stable geometry:
- Derive circle center and radius from pixel bounds.
- Keep overlays clipped to the video frame.
- Update geometry on resize with debounced handlers.
4. Animate feedback:
- Use Framer Motion pulse style with subtle opacity or scale transitions.
- Keep animation lightweight for continuous realtime updates.
5. Verify behavior:
- Add unit tests for conversion math.
- Confirm visual alignment against known objects at multiple resolutions.
