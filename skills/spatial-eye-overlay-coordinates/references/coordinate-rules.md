# Coordinate Rules

## Canonical Format

- Accept model output as `[ymin, xmin, ymax, xmax]`.
- Treat values as normalized integers or floats in range 0-1000.

## Pixel Conversion

Given `videoWidth` and `videoHeight`:

- `top = (ymin / 1000) * videoHeight`
- `left = (xmin / 1000) * videoWidth`
- `bottom = (ymax / 1000) * videoHeight`
- `right = (xmax / 1000) * videoWidth`

Derive geometry:

- `width = right - left`
- `height = bottom - top`
- `centerX = left + width / 2`
- `centerY = top + height / 2`
- `radius = max(width, height) / 2`

## Validation Rules

- Reject any coordinate outside 0-1000.
- Reject boxes where `ymax <= ymin`.
- Reject boxes where `xmax <= xmin`.

## Rendering Rules

- Keep overlay container dimension-locked to the video element.
- Recompute overlays after resize with debounced updates.
- Use Framer Motion pulse effect with subtle opacity change.

## Test Cases

- Convert `[150, 200, 350, 450]` with `1920x1080` to:
  `top=162`, `left=384`, `bottom=378`, `right=864`.
- Verify overlays stay aligned after viewport resize.
- Verify invalid coordinates do not render circles.
