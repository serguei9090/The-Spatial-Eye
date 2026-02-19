/**
 * PCM Capture Processor
 *
 * An AudioWorkletProcessor that captures raw audio frames and posts
 * them to the main thread. Runs in the audio rendering thread for
 * minimal latency, replacing the deprecated ScriptProcessorNode.
 *
 * Audio spec (Gemini Live API input):
 *   - 16-bit PCM
 *   - 16kHz sample rate
 *   - Mono (1 channel)
 */
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 1024; // ~64ms at 16kHz
  }

  /**
   * process() is called for each audio rendering quantum (128 samples).
   * We accumulate samples into a buffer and flush when full.
   */
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // Mono: first channel
    for (let i = 0; i < channelData.length; i++) {
      this._buffer.push(channelData[i]);
    }

    if (this._buffer.length >= this._bufferSize) {
      this.port.postMessage({ type: "pcm", samples: new Float32Array(this._buffer) });
      this._buffer = [];
    }

    return true; // Keep processor alive
  }
}

registerProcessor("pcm-capture-processor", PcmCaptureProcessor);
