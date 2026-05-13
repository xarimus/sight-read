import { NOTES } from './targets.js';

export function stringOf(note) {
  return Number(note.alphaTex.split('.')[1]);
}

export function fretOf(note) {
  return Number(note.alphaTex.split('.')[0]);
}

export function isNatural(note) {
  return !/[#b]/.test(note.label);
}

/**
 * Build a deduplicated MIDI pool from a selection description.
 *
 * @param {object} sel
 * @param {Set<number>} sel.strings            - string numbers 1..6 that are "on"
 * @param {Set<number>} sel.accidentalsByString - strings whose accidentals are included
 * @param {Map<number,string>} sel.individualOverrides - midi → 'on'|'off'
 * @returns {number[]} sorted, unique MIDI numbers
 */
export function buildPool({ strings, accidentalsByString, individualOverrides }) {
  const seen = new Set();

  for (const note of NOTES) {
    const str = stringOf(note);
    if (!strings.has(str)) continue;

    const natural = isNatural(note);
    if (!natural && !accidentalsByString.has(str)) continue;

    const override = individualOverrides.get(note.midi);
    if (override === 'off') continue;

    seen.add(note.midi);
  }

  // Apply 'on' overrides for notes not naturally in the selection
  for (const [midi, state] of individualOverrides) {
    if (state === 'on') seen.add(midi);
  }

  return [...seen].sort((a, b) => a - b);
}
