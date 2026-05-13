/**
 * Match-Lock-Release state machine (spec §4).
 *
 * Pure step function — no DOM access, easy to unit-test later.
 *
 * step(state, event, targetMidi, config) → { state, output }
 *
 * event shapes:
 *   { type: 'pitch', midi, cents, clarity, rms }
 *   { type: 'silence', rms }
 *
 * output shapes (or null):
 *   { type: 'MATCH' }
 *   { type: 'WRONG', midi }
 *   { type: 'RELEASE' }
 */

export function createState() {
  return {
    phase: 'WAITING',   // 'WAITING' | 'MATCHED'
    stableCount: 0,
    silenceCount: 0,
    lastWrongMidi: null,
  };
}

export function step(state, event, targetMidi, config) {
  const {
    confirmationThreshold = 2,
    silenceFrameThreshold = 5,
    noiseGate = 0.01,
    clarityThreshold = 0.7,
  } = config;

  const s = { ...state };
  let output = null;

  if (event.type === 'silence' || event.rms < noiseGate) {
    if (s.phase === 'MATCHED') {
      s.silenceCount++;
      if (s.silenceCount >= silenceFrameThreshold) {
        s.phase = 'WAITING';
        s.stableCount = 0;
        s.silenceCount = 0;
        s.lastWrongMidi = null;
        output = { type: 'RELEASE' };
      }
    } else {
      // Reset stable count on silence so partial confirmations don't persist
      s.stableCount = 0;
    }
    return { state: s, output };
  }

  // Pitch event above noise gate
  if (s.phase === 'MATCHED') {
    // Wait for silence to release
    s.silenceCount = 0;
    return { state: s, output: null };
  }

  // WAITING phase
  const isCorrect = event.midi === targetMidi && Math.abs(event.cents) <= 50;
  const isConfident = event.clarity >= clarityThreshold;

  if (isCorrect && isConfident) {
    s.stableCount++;
    s.lastWrongMidi = null;
    if (confirmationThreshold === 0 || s.stableCount >= confirmationThreshold) {
      s.phase = 'MATCHED';
      s.stableCount = 0;
      s.silenceCount = 0;
      output = { type: 'MATCH' };
    }
  } else if (!isCorrect && isConfident) {
    s.stableCount = 0;
    if (event.midi !== s.lastWrongMidi) {
      s.lastWrongMidi = event.midi;
      output = { type: 'WRONG', midi: event.midi };
    }
  } else {
    // Low-confidence pitch — reset stable count but don't fire wrong
    s.stableCount = 0;
  }

  return { state: s, output };
}
