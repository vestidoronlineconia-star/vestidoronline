

## Plan: Fix Camera Not Activating in Onboarding

### Root Cause

Classic chicken-and-egg problem in `Onboarding.tsx`:

1. The `<video>` element is only rendered when `cameraActive === true` (line 338)
2. `startCamera()` tries to assign the stream to `videoRef.current` (line 87) before setting `cameraActive = true` (line 91)
3. Since the video element doesn't exist yet, `videoRef.current` is `null`, so the stream is never attached
4. The camera permissions are granted, but nothing is displayed

### Fix

**File: `src/pages/Onboarding.tsx`**

Two changes:

1. **Always render the video element** — move it outside the `cameraActive` conditional. Use CSS to hide/show it instead of conditional rendering. This ensures `videoRef.current` is available when `startCamera` assigns the stream.

2. **Use an `onPlaying` callback on the video** — after the stream is assigned and the video starts playing, then set `cameraActive = true` to update the UI state (hide the placeholder, show controls).

The placeholder "Presioná para activar la cámara" and the preview image will overlay the video when it's not active. The video element will always be in the DOM but visually hidden behind other content until the camera is ready.

