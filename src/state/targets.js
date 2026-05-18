/**
 * The 28 first-position notes (spec §5).
 *
 * fretString format is fret.string (NOT string.fret as the spec table shows).
 * e.g. open low E = fret 0, string 6 → "0.6"
 *
 * B3 on string 3 (fret 4, string 3 = "4.3") is omitted — spec says to use
 * open B on string 2 ("0.2") as primary target.
 */
const NOTES = [
  { midi: 40, fretString: '0.6', label: 'E2' },
  { midi: 41, fretString: '1.6', label: 'F2' },
  { midi: 42, fretString: '2.6', label: 'F#2' },
  { midi: 43, fretString: '3.6', label: 'G2' },
  { midi: 44, fretString: '4.6', label: 'G#2' },
  { midi: 45, fretString: '0.5', label: 'A2' },
  { midi: 46, fretString: '1.5', label: 'Bb2' },
  { midi: 47, fretString: '2.5', label: 'B2' },
  { midi: 48, fretString: '3.5', label: 'C3' },
  { midi: 49, fretString: '4.5', label: 'Db3' },
  { midi: 50, fretString: '0.4', label: 'D3' },
  { midi: 51, fretString: '1.4', label: 'Eb3' },
  { midi: 52, fretString: '2.4', label: 'E3' },
  { midi: 53, fretString: '3.4', label: 'F3' },
  { midi: 54, fretString: '4.4', label: 'F#3' },
  { midi: 55, fretString: '0.3', label: 'G3' },
  { midi: 56, fretString: '1.3', label: 'G#3' },
  { midi: 57, fretString: '2.3', label: 'A3' },
  { midi: 58, fretString: '3.3', label: 'Bb3' },
  { midi: 59, fretString: '0.2', label: 'B3' },
  { midi: 60, fretString: '1.2', label: 'C4' },
  { midi: 61, fretString: '2.2', label: 'Db4' },
  { midi: 62, fretString: '3.2', label: 'D4' },
  { midi: 63, fretString: '4.2', label: 'Eb4' },
  { midi: 64, fretString: '0.1', label: 'E4' },
  { midi: 65, fretString: '1.1', label: 'F4' },
  { midi: 66, fretString: '2.1', label: 'F#4' },
  { midi: 67, fretString: '3.1', label: 'G4' },
  { midi: 68, fretString: '4.1', label: 'G#4' },
];

export function createTargetSource() {
  let index = 0;
  return {
    current() { return NOTES[index]; },
    advance() { index = (index + 1) % NOTES.length; },
    get total() { return NOTES.length; },
    get position() { return index; },
  };
}

/**
 * Random target source backed by a MIDI pool.
 * Avoids picking the same note twice in a row when pool size > 1.
 *
 * @param {number[]} midiPool - array of MIDI numbers (deduplicated)
 * @param {object} [opts]
 * @param {number} [opts.minIntervalSemitones=0] - minimum semitone gap between consecutive picks
 */
export function createPoolTargetSource(midiPool, { minIntervalSemitones = 0 } = {}) {
  const notes = midiPool
    .map(m => NOTES.find(n => n.midi === m))
    .filter(Boolean);
  if (notes.length === 0) throw new Error('Empty note pool');

  function pickRandom(excludeIdx) {
    if (notes.length === 1) return 0;
    const maxTries = notes.length * 4;
    let idx;
    let tries = 0;
    do {
      idx = Math.floor(Math.random() * notes.length);
      tries++;
      const tooClose = minIntervalSemitones > 0 && excludeIdx >= 0 &&
        Math.abs(notes[idx].midi - notes[excludeIdx].midi) < minIntervalSemitones;
      if (idx !== excludeIdx && !tooClose) break;
    } while (tries < maxTries);
    return idx;
  }

  let currentIdx = pickRandom(-1);
  let advances = 0;

  return {
    current()    { return notes[currentIdx]; },
    advance()    { currentIdx = pickRandom(currentIdx); advances++; },
    get total()  { return notes.length; },
    get position() { return advances; },
  };
}

export { NOTES };
