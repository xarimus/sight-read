import { detectPitch } from './yin.js';

/**
 * PitchDetector factory. Returns a detector object with a single method:
 *   detect(Float32Array, sampleRate, config) → { frequency, clarity, rms } | null
 *
 * The interface is kept thin so a BasicPitch or CREPE backend can be swapped in
 * for polyphonic Phrase/Song mode without touching call sites.
 */
export function createYinDetector() {
  return {
    detect(buffer, sampleRate, config) {
      return detectPitch(buffer, sampleRate, config);
    },
  };
}
