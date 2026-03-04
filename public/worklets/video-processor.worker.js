/**
 * Video Processor Worker (Base64 optimized)
 */

globalThis.onmessage = async (e) => {
  const { imageBitmap, width, height, quality } = e.data;

  try {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Failed to get OffscreenCanvas context");

    ctx.drawImage(imageBitmap, 0, 0, width, height);

    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: quality || 0.65,
    });

    // 1. Convert to ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();

    // 2. Convert to base64 in the worker
    const base64 = await arrayBufferToBase64(arrayBuffer);

    // 3. Post back to main thread
    self.postMessage({
      type: "frame",
      data: base64,
      width,
      height,
    });

    // 4. Cleanup
    imageBitmap.close();
  } catch (err) {
    self.postMessage({
      type: "error",
      error: err.message,
    });
  }
};

/**
 * Optimized ArrayBuffer to Base64 conversion
 */
async function arrayBufferToBase64(buffer) {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCodePoint(uint8Array[i]);
  }
  return btoa(binary);
}
