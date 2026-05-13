/**
 * AudioWorklet processor. Collects incoming samples into a fixed-size
 * chunk and posts them to the main thread for YIN processing.
 * Kept intentionally minimal — all pitch logic lives on the main thread.
 */
class SamplerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._chunkSize = 2048; // ~93 ms at 22050 Hz; main thread decides actual window
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];
    for (let i = 0; i < channel.length; i++) {
      this._buf.push(channel[i]);
    }

    if (this._buf.length >= this._chunkSize) {
      this.port.postMessage(new Float32Array(this._buf.splice(0, this._chunkSize)));
    }

    return true;
  }
}

registerProcessor('sampler-processor', SamplerProcessor);
