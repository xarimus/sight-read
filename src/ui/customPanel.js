import { NOTES, } from '../state/targets.js';
import { stringOf, fretOf, isNatural } from '../state/pool.js';

// Guitar strings: 1 = high E, 6 = low E
const STRINGS = [1, 2, 3, 4, 5, 6];
const STRING_NAMES = { 1: 'E', 2: 'B', 3: 'G', 4: 'D', 5: 'A', 6: 'E' };
const FRETS = [0, 1, 2, 3, 4];

// The twin positions that share MIDI 59 (B3).
// Position string=3, fret=4 is not in NOTES but we render it and link it to the canonical 2,0.
const TWIN_A = { midi: 59, string: 2, fret: 0 };  // canonical — in NOTES
const TWIN_B = { midi: 59, string: 3, fret: 4 };  // alias

/**
 * Custom fretboard panel.
 *
 * Returns:
 *   { getSelection() → { midiSet: Set<number>, stopSpec }, restoreState(saved), saveState(), setDisabled(bool), onPoolChange(cb) }
 */
export function createCustomPanel(container) {
  // Selection state (strings → sets of selected MIDIs)
  const selected = new Set(); // Set of selected MIDI numbers

  // Build note lookup: { string, fret } → note | undefined
  const noteAt = new Map();
  for (const note of NOTES) {
    noteAt.set(`${stringOf(note)},${fretOf(note)}`, note);
  }

  // --- Render the grid ---
  const grid = document.createElement('div');
  grid.className = 'fret-grid';

  // Count header row
  const countEl = document.createElement('div');
  countEl.className = 'fret-count';
  countEl.textContent = '0 notes selected';
  container.appendChild(countEl);

  // Column header: fret labels + global # button
  const headerRow = document.createElement('div');
  headerRow.className = 'fret-header-row';
  headerRow.appendChild(makeEl('div', 'fret-string-label', '')); // corner
  FRETS.forEach(f => {
    headerRow.appendChild(makeEl('div', 'fret-col-label', f === 0 ? 'open' : `fret ${f}`));
  });
  const globalSharpBtn = makeEl('button', 'sharp-btn sharp-btn--global', '#');
  globalSharpBtn.title = 'Toggle accidentals on all strings with selected notes';
  headerRow.appendChild(globalSharpBtn);
  grid.appendChild(headerRow);

  // Per-string rows
  const perStringSharpBtns = {};

  STRINGS.forEach(str => {
    const row = document.createElement('div');
    row.className = 'fret-row';

    // String label (click to toggle row)
    const strLabel = makeEl('button', 'fret-string-label fret-string-label--btn',
      `${str}│${STRING_NAMES[str]}`);
    strLabel.title = `Toggle all notes on string ${str}`;
    strLabel.addEventListener('click', () => toggleRow(str));
    row.appendChild(strLabel);

    // Fret cells
    FRETS.forEach(fret => {
      const cell = document.createElement('button');
      cell.className = 'fret-cell';
      cell.dataset.str = str;
      cell.dataset.fret = fret;

      const isTwinB = str === TWIN_B.string && fret === TWIN_B.fret;
      const note = noteAt.get(`${str},${fret}`);
      const midi = isTwinB ? TWIN_B.midi : note?.midi;

      if (isTwinB) {
        cell.classList.add('fret-cell--twin');
        cell.title = 'Same pitch as string 2 fret 0 — B3 (MIDI 59)';
      } else if (!note) {
        cell.classList.add('fret-cell--empty');
        cell.disabled = true;
      } else {
        cell.title = `${note.label} (MIDI ${note.midi})`;
      }

      if (note && str === TWIN_A.string && fret === TWIN_A.fret) {
        cell.classList.add('fret-cell--twin');
        cell.title = 'B3 — also playable at string 3 fret 4 (same pitch)';
      }

      if (midi != null && !cell.disabled) {
        cell.addEventListener('click', () => toggleMidi(midi));
      }

      cell.dataset.midi = midi ?? '';
      row.appendChild(cell);
    });

    // Per-string # button
    const sharpBtn = makeEl('button', 'sharp-btn', '#');
    sharpBtn.title = `Toggle accidentals on string ${str}`;
    sharpBtn.dataset.str = str;
    sharpBtn.addEventListener('click', () => toggleStringAccidentals(str));
    perStringSharpBtns[str] = sharpBtn;
    row.appendChild(sharpBtn);

    grid.appendChild(row);
  });

  container.appendChild(grid);

  // Global # handler
  globalSharpBtn.addEventListener('click', () => {
    // Find strings that have at least one selected natural note
    const stringsWithSelection = STRINGS.filter(str =>
      NOTES.some(n => stringOf(n) === str && isNatural(n) && selected.has(n.midi))
      || (str === TWIN_A.string && selected.has(TWIN_A.midi) && isNatural(noteAt.get(`${TWIN_A.string},${TWIN_A.fret}`)))
    );
    stringsWithSelection.forEach(str => toggleStringAccidentals(str));
  });

  // Stop-condition row
  const stopRow = document.createElement('div');
  stopRow.className = 'stop-row';
  stopRow.innerHTML = `
    <span class="stop-label">Stop after</span>
    <div class="stop-options">
      <label class="stop-opt"><input type="radio" name="custom-stop" value="count"> Notes</label>
      <label class="stop-opt"><input type="radio" name="custom-stop" value="time" checked> Time</label>
      <label class="stop-opt"><input type="radio" name="custom-stop" value="endless"> Endless</label>
    </div>
    <input class="stop-num" type="number" min="1" max="9999" value="120">
    <span class="stop-unit">seconds</span>
  `;
  container.appendChild(stopRow);

  const stopNum = stopRow.querySelector('.stop-num');
  const stopUnit = stopRow.querySelector('.stop-unit');
  const radios = stopRow.querySelectorAll('input[name="custom-stop"]');
  radios.forEach(r => r.addEventListener('change', () => {
    const type = getStopType();
    stopNum.style.display = type === 'endless' ? 'none' : '';
    stopUnit.textContent = type === 'time' ? 's' : 'notes';
  }));

  // --- Interaction logic ---
  let _poolChangeCb = null;

  function toggleMidi(midi) {
    const twin = midi === TWIN_A.midi || midi === TWIN_B.midi;
    const canonicalMidi = twin ? TWIN_A.midi : midi;

    if (selected.has(canonicalMidi)) {
      selected.delete(canonicalMidi);
    } else {
      selected.add(canonicalMidi);
    }
    refreshCells();
    _poolChangeCb?.([...selected]);
  }

  function toggleRow(str) {
    // Collect notes on this string (including twin alias mapping)
    const rowMidis = getRowMidis(str);
    const allOn = rowMidis.every(m => selected.has(m));
    if (allOn) {
      rowMidis.forEach(m => selected.delete(m));
    } else {
      rowMidis.forEach(m => selected.add(m));
    }
    refreshCells();
    _poolChangeCb?.([...selected]);
  }

  function toggleStringAccidentals(str) {
    const accMidis = getAccidentalMidis(str);
    if (accMidis.length === 0) return;
    const allOn = accMidis.every(m => selected.has(m));
    if (allOn) {
      accMidis.forEach(m => selected.delete(m));
    } else {
      accMidis.forEach(m => selected.add(m));
    }
    refreshCells();
    _poolChangeCb?.([...selected]);
  }

  function getRowMidis(str) {
    const midis = NOTES.filter(n => stringOf(n) === str).map(n => n.midi);
    // If string 3, also logically includes TWIN_B → canonical MIDI 59 (already in string 2 notes)
    // If string 2 and TWIN_A is in it, that's the canonical B3 — already covered by NOTES filter
    return [...new Set(midis)];
  }

  function getAccidentalMidis(str) {
    return NOTES
      .filter(n => stringOf(n) === str && !isNatural(n))
      .map(n => n.midi);
  }

  function refreshCells() {
    grid.querySelectorAll('.fret-cell:not(.fret-cell--empty)').forEach(cell => {
      const midi = cell.dataset.midi ? Number(cell.dataset.midi) : null;
      if (midi == null) return;
      const on = selected.has(midi === TWIN_B.midi ? TWIN_A.midi : midi);
      cell.classList.toggle('fret-cell--on', on);
    });
    countEl.textContent = `${selected.size} note${selected.size === 1 ? '' : 's'} selected`;
  }

  function getStopType() {
    return [...radios].find(r => r.checked)?.value ?? 'count';
  }

  return {
    getSelection() {
      const type = getStopType();
      let stopSpec;
      if (type === 'endless') {
        stopSpec = { type: 'endless' };
      } else if (type === 'time') {
        stopSpec = { type: 'time', seconds: Math.max(1, Number(stopNum.value)) };
      } else {
        stopSpec = { type: 'count', count: Math.max(1, Number(stopNum.value)) };
      }
      return { midiSet: new Set(selected), stopSpec };
    },

    onPoolChange(cb) { _poolChangeCb = cb; },

    get size() { return selected.size; },

    setDisabled(disabled) {
      grid.querySelectorAll('button').forEach(b => { b.disabled = disabled; });
      radios.forEach(r => { r.disabled = disabled; });
      stopNum.disabled = disabled;
    },

    restoreState(saved) {
      if (!saved) return;
      selected.clear();
      (saved.midis ?? []).forEach(m => selected.add(m));
      if (saved.stop) {
        const radio = [...radios].find(r => r.value === saved.stop.type);
        if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
        if (saved.stop.seconds != null) stopNum.value = saved.stop.seconds;
        if (saved.stop.count != null) stopNum.value = saved.stop.count;
      }
      refreshCells();
    },

    saveState() {
      const type = getStopType();
      const stop = type === 'endless' ? { type } :
                   type === 'time'    ? { type, seconds: Number(stopNum.value) } :
                                        { type, count: Number(stopNum.value) };
      return { midis: [...selected], stop };
    },
  };
}

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
