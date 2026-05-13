/**
 * Curated preset definitions — full first-position sight-reading presets.
 *
 * Schema:
 *   id          — unique string key
 *   label       — display text
 *   block       — 1..6, used for section grouping in the UI
 *   strings     — guitar strings (1=high E ... 6=low E) that contribute notes
 *   accidentals — subset of strings whose sharp/flat notes are also included
 *   overrides   — { onMidis, offMidis } to force individual MIDI notes on/off
 *   targetMode  — 'random' (default) | 'random-min-interval'
 *   minInterval — semitones, used with 'random-min-interval' (default 7)
 *
 * To add a preset: append an entry here — no other code changes needed unless
 * overrides or a non-default targetMode is required (both are handled in main.js).
 */
export const PRESETS = [

  // ── Block 1: Isolated String Foundations ──────────────────────────────────
  // Each string in isolation. Builds staff-position ↔ string memory.

  { block: 1, id: 'b1-s1', label: 'High E (str 1)  — E4, F4, G4',
    strings: [1], accidentals: [] },

  { block: 1, id: 'b1-s2', label: 'B string (str 2) — B3, C4, D4',
    strings: [2], accidentals: [] },

  { block: 1, id: 'b1-s3', label: 'G string (str 3) — G3, A3',
    strings: [3], accidentals: [] },

  { block: 1, id: 'b1-s4', label: 'D string (str 4) — D3, E3, F3',
    strings: [4], accidentals: [] },

  { block: 1, id: 'b1-s5', label: 'A string (str 5) — A2, B2, C3',
    strings: [5], accidentals: [] },

  { block: 1, id: 'b1-s6', label: 'Low E (str 6)  — E2, F2, G2',
    strings: [6], accidentals: [] },

  // ── Block 2: Connecting the Strings ───────────────────────────────────────
  // String-crossing drills. Natural notes only; focus is on spatial jumping.

  { block: 2, id: 'b2-treble-trio', label: 'Treble trio (str 1–3) — naturals',
    strings: [1, 2, 3], accidentals: [] },

  { block: 2, id: 'b2-bass-trio', label: 'Bass trio (str 4–6) — naturals',
    strings: [4, 5, 6], accidentals: [] },

  { block: 2, id: 'b2-middle-zone', label: 'Middle zone (str 3–4) — naturals',
    strings: [3, 4], accidentals: [] },

  { block: 2, id: 'b2-outer-extremes', label: 'Outer extremes (str 1 & 6) — naturals',
    strings: [1, 6], accidentals: [] },

  // ── Block 3: Diatonic Mastery ─────────────────────────────────────────────
  // All 16 natural notes across all 6 strings — standard Level 1 mastery.

  { block: 3, id: 'b3-all-naturals', label: 'All strings — naturals only (16 notes)',
    strings: [1, 2, 3, 4, 5, 6], accidentals: [] },

  // ── Block 4: Introducing Accidentals ─────────────────────────────────────
  // Common sharps and flats from beginner repertoire.

  { block: 4, id: 'b4-fsharp-csharp', label: 'Common sharps — F# and C#',
    strings: [], accidentals: [],
    overrides: { onMidis: [42, 54, 66, 49, 61] } },        // F#2,F#3,F#4 + Db3,Db4

  { block: 4, id: 'b4-bflat-eflat', label: 'Common flats — Bb and Eb',
    strings: [], accidentals: [],
    overrides: { onMidis: [46, 58, 51, 63] } },             // Bb2,Bb3 + Eb3,Eb4

  { block: 4, id: 'b4-treble-chromatic', label: 'Treble chromatic (str 1–3)',
    strings: [1, 2, 3], accidentals: [1, 2, 3] },

  { block: 4, id: 'b4-bass-chromatic', label: 'Bass chromatic (str 4–6)',
    strings: [4, 5, 6], accidentals: [4, 5, 6] },

  // ── Block 5: Full First-Position Mastery ──────────────────────────────────

  { block: 5, id: 'b5-full-chromatic', label: 'Full chromatic — all 29 notes',
    strings: [1, 2, 3, 4, 5, 6], accidentals: [1, 2, 3, 4, 5, 6] },

  // ── Block 6: Elite Challenges ─────────────────────────────────────────────

  { block: 6, id: 'b6-ledger-sprint', label: 'Ledger-line sprint — extreme highs & lows',
    strings: [], accidentals: [],
    overrides: { onMidis: [40, 41, 43, 67, 68] } },        // E2,F2,G2 + G4,G#4

  { block: 6, id: 'b6-wide-jumps', label: 'Wide-interval jumps (≥ a 5th apart)',
    strings: [1, 2, 3, 4, 5, 6], accidentals: [1, 2, 3, 4, 5, 6],
    targetMode: 'random-min-interval', minInterval: 7 },

];

export const BLOCK_TITLES = {
  1: 'Block 1 — Isolated String Foundations',
  2: 'Block 2 — Connecting the Strings',
  3: 'Block 3 — Diatonic Mastery',
  4: 'Block 4 — Adding Accidentals',
  5: 'Block 5 — Full First-Position',
  6: 'Block 6 — Elite Challenges',
};
