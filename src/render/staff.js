import { AlphaTabApi, Settings, StaveProfile, model } from '@coderline/alphatab';

const { NoteStyle, NoteSubElement, Color } = model;

const GREEN = new Color(34, 197, 94, 255);   // #22c55e
const RED   = new Color(239, 68, 68, 255);   // #ef4444

// MIDI → AlphaTex note (fret.string order, no brackets — single notes)
const MIDI_TO_ALPHATEX = {
  40: '0.6', 41: '1.6', 42: '2.6', 43: '3.6', 44: '4.6',
  45: '0.5', 46: '1.5', 47: '2.5', 48: '3.5', 49: '4.5',
  50: '0.4', 51: '1.4', 52: '2.4', 53: '3.4', 54: '4.4',
  55: '0.3', 56: '1.3', 57: '2.3', 58: '3.3', 59: '0.2',
  60: '1.2', 61: '2.2', 62: '3.2', 63: '4.2',
  64: '0.1', 65: '1.1', 66: '2.1', 67: '3.1', 68: '4.1',
};

// AlphaTex tuning: string 1 (high E4) → string 6 (low E2)
const GUITAR_TUNING = 'E4 B3 G3 D3 A2 E2';

/**
 * Wraps AlphaTab for staff rendering.
 *
 *   const staff = createStaff(containerEl);
 *   await staff.ready;
 *   staff.renderTarget(target);
 *   staff.showMatch();
 *   staff.showWrong(wrongMidi);
 */
export function createStaff(container) {
  const settings = new Settings();
  settings.core.engine = 'html5';
  settings.core.logLevel = 2;
  settings.core.fontDirectory = '/font/';
  settings.display.staveProfile = StaveProfile.Score;  // notation only, no tab
  settings.display.scale = window.matchMedia('(max-width: 768px)').matches ? 1.5 : 2.0;
  settings.player.enablePlayer = false;
  settings.player.enableCursor = false;

  const api = new AlphaTabApi(container, settings);

  api.error.on((err) => console.error('[AlphaTab error]', err));
  api.postRenderFinished.on(() => console.debug('[AlphaTab] render complete'));

  let _target = null;
  let _playedMidi = null;
  let _playedCorrect = false;
  let _pendingColors = [];

  api.scoreLoaded.on((score) => {
    for (const { barIdx, beatIdx, noteIdx, color } of _pendingColors) {
      try {
        const note = score.tracks[0].staves[0].bars[barIdx].voices[0].beats[beatIdx].notes[noteIdx];
        if (note) {
          if (!note.style) note.style = new NoteStyle();
          note.style.colors.set(NoteSubElement.StandardNotationNoteHead, color);
          note.style.colors.set(NoteSubElement.StandardNotationAccidentals, color);
        }
      } catch { /* score shape may differ; skip */ }
    }
    _pendingColors = [];
  });

  function buildTex() {
    // \tuning requires parentheses in AlphaTex v1.8; :1 = whole note, :4 = quarter note, etc.
    const header = `\\track "Drill" \\tuning(${GUITAR_TUNING}){hide} \\defaultBarNumberDisplay hide \\hideDynamics`;
    const targetBeat = `:4 ${_target.alphaTex}`;
    if (_playedMidi !== null) {
      const playedTex = MIDI_TO_ALPHATEX[_playedMidi] ?? '0.1';
      return `${header} ${targetBeat} | :4 ${playedTex}`;
    }
    return `${header} ${targetBeat} | :1 r`;
  }

  function render() {
    if (!_target) return;
    _pendingColors = [];

    if (_playedMidi !== null) {
      _pendingColors.push({ barIdx: 1, beatIdx: 0, noteIdx: 0, color: _playedCorrect ? GREEN : RED });
    }

    const tex = buildTex();
    console.debug('[AlphaTab tex]', tex);
    api.tex(tex);
  }

  return {
    renderTarget(target) {
      _target = target;
      _playedMidi = null;
      _playedCorrect = false;
      render();
    },
    showMatch(midi) {
      _playedMidi = midi;
      _playedCorrect = true;
      render();
    },
    showWrong(midi) {
      _playedMidi = midi;
      _playedCorrect = false;
      render();
    },
    clear() {
      _playedMidi = null;
      _playedCorrect = false;
      render();
    },
  };
}
