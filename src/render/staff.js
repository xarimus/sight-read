const NS = 'http://www.w3.org/2000/svg';

// Bravura SMuFL codepoints
const GLYPH = {
  clef:  '',  // gClef
  sharp: '',  // accidentalSharp
  flat:  '',  // accidentalFlat
};

// Staff geometry (viewBox units)
const S        = 14;          // staff line spacing
const HS       = S / 2;       // one diatonic step height
const FS       = S * 4;       // Bravura font-size (1 staff space = 0.25 em in Bravura)
const RX       = S * 0.62;    // notehead x-radius
const RY       = S * 0.40;    // notehead y-radius
const STEM_LEN = S * 3.5;

const TOP  = S * 7;            // padding above top staff line
const BOT  = S * 5;            // padding below bottom staff line
const YBL  = TOP + S * 4;      // y of bottom staff line
const SH   = YBL + BOT;        // SVG height  (= 224 at S=14)
const SW   = 380;              // SVG width

const STAFF_X0 = 14;
const STAFF_X1 = SW - 14;
const CLEF_X   = 18;
const N1X = 160;        // bar-1 note centre x
const BL_X = 240;       // mid barline x
const N2X = 310;        // bar-2 note centre x
const FB_X = SW - 16;   // final thin barline x

// Guitar treble clef is written an octave higher than concert pitch.
// pos = diatonic steps above the bottom staff line (notated E5 / concert E4).
// Spellings follow the labels in state/targets.js.
const NOTE_INFO = {
  40: { p: -7, a: null    },  // E2  → notated E3
  41: { p: -6, a: null    },  // F2  → notated F3
  42: { p: -6, a: 'sharp' },  // F#2 → notated F#3
  43: { p: -5, a: null    },  // G2  → notated G3
  44: { p: -5, a: 'sharp' },  // G#2 → notated G#3
  45: { p: -4, a: null    },  // A2  → notated A3
  46: { p: -3, a: 'flat'  },  // Bb2 → notated Bb3
  47: { p: -3, a: null    },  // B2  → notated B3
  48: { p: -2, a: null    },  // C3  → notated C4
  49: { p: -1, a: 'flat'  },  // Db3 → notated Db4
  50: { p: -1, a: null    },  // D3  → notated D4
  51: { p:  0, a: 'flat'  },  // Eb3 → notated Eb4
  52: { p:  0, a: null    },  // E3  → notated E4
  53: { p:  1, a: null    },  // F3  → notated F4
  54: { p:  1, a: 'sharp' },  // F#3 → notated F#4
  55: { p:  2, a: null    },  // G3  → notated G4
  56: { p:  2, a: 'sharp' },  // G#3 → notated G#4
  57: { p:  3, a: null    },  // A3  → notated A4
  58: { p:  4, a: 'flat'  },  // Bb3 → notated Bb4
  59: { p:  4, a: null    },  // B3  → notated B4
  60: { p:  5, a: null    },  // C4  → notated C5
  61: { p:  6, a: 'flat'  },  // Db4 → notated Db5
  62: { p:  6, a: null    },  // D4  → notated D5
  63: { p:  7, a: 'flat'  },  // Eb4 → notated Eb5
  64: { p:  7, a: null    },  // E4  → notated E5
  65: { p:  8, a: null    },  // F4  → notated F5 (top staff line)
  66: { p:  8, a: 'sharp' },  // F#4 → notated F#5
  67: { p:  9, a: null    },  // G4  → notated G5
  68: { p:  9, a: 'sharp' },  // G#4 → notated G#5
};

// Positions of ledger lines needed for a note below the staff (pos < -1).
// Lines below the staff are at even positions -2, -4, -6, ...
function ledgerPositions(pos) {
  if (pos >= -1) return [];
  const bottom = pos % 2 === 0 ? pos : pos + 1;
  const result = [];
  for (let i = -2; i >= bottom; i -= 2) result.push(i);
  return result;
}

function injectFont() {
  if (document.getElementById('bravura-font')) return;
  const style = document.createElement('style');
  style.id = 'bravura-font';
  style.textContent = `
    @font-face {
      font-family: 'Bravura';
      src: url('/font/Bravura.woff2') format('woff2'),
           url('/font/Bravura.woff')  format('woff');
      font-weight: normal;
      font-style: normal;
    }
  `;
  document.head.appendChild(style);
}

function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function noteY(pos) { return YBL - pos * HS; }

function drawNote(svg, x, pos, acc, color) {
  const y = noteY(pos);
  const stemUp = pos <= 4;

  for (const lp of ledgerPositions(pos)) {
    const ly = noteY(lp);
    svg.appendChild(el('line', {
      x1: x - RX - 4, y1: ly, x2: x + RX + 4, y2: ly,
      stroke: color, 'stroke-width': 1.3,
    }));
  }

  const sx  = stemUp ? x + RX : x - RX;
  const sy1 = y;
  const sy2 = stemUp ? y - STEM_LEN : y + STEM_LEN;
  svg.appendChild(el('line', {
    x1: sx, y1: sy1, x2: sx, y2: sy2,
    stroke: color, 'stroke-width': 1.3,
  }));

  const g = el('g', { transform: `translate(${x},${y}) rotate(-18)` });
  g.appendChild(el('ellipse', { cx: 0, cy: 0, rx: RX, ry: RY, fill: color }));
  svg.appendChild(g);

  if (acc) {
    const accEl = el('text', {
      x: x - RX - 2,
      y,
      'text-anchor': 'end',
      'dominant-baseline': 'auto',
      'font-family': 'Bravura, serif',
      'font-size': FS,
      fill: color,
    });
    accEl.textContent = acc === 'sharp' ? GLYPH.sharp : GLYPH.flat;
    svg.appendChild(accEl);
  }
}

// Whole rest: filled rectangle hanging from the 4th staff line (pos 6 = notated D5).
function drawWholeRest(svg, x) {
  const y  = noteY(6);
  const rW = S * 1.5;
  const rH = S * 0.55;
  svg.appendChild(el('rect', {
    x: x - rW / 2, y, width: rW, height: rH, fill: '#000',
  }));
}

export function createStaff(container) {
  injectFont();

  let _target      = null;
  let _playedMidi  = null;
  let _playedColor = '#000';

  function render() {
    container.innerHTML = '';
    if (!_target) return;

    const ni1 = NOTE_INFO[_target.midi];
    if (!ni1) return;

    const svg = el('svg', {
      viewBox: `0 0 ${SW} ${SH}`,
      width: '100%',
      style: `max-width:${SW}px;display:block`,
      'aria-hidden': 'true',
    });

    // Staff lines (bottom = pos 0, top = pos 8)
    for (let i = 0; i <= 4; i++) {
      const y = YBL - i * S;
      svg.appendChild(el('line', {
        x1: STAFF_X0, y1: y, x2: STAFF_X1, y2: y,
        stroke: '#000', 'stroke-width': 1.2,
      }));
    }

    // Treble clef — Bravura baseline anchors on the G4-notated line (2nd from bottom = YBL - S)
    const clefEl = el('text', {
      x: CLEF_X,
      y: YBL - S,
      'font-family': 'Bravura, serif',
      'font-size': FS,
      fill: '#000',
    });
    clefEl.textContent = GLYPH.clef;
    svg.appendChild(clefEl);

    // Mid barline
    svg.appendChild(el('line', {
      x1: BL_X, y1: YBL - 4 * S, x2: BL_X, y2: YBL,
      stroke: '#000', 'stroke-width': 1.2,
    }));

    // Final barline: thin line + thick block
    svg.appendChild(el('line', {
      x1: FB_X, y1: YBL - 4 * S, x2: FB_X, y2: YBL,
      stroke: '#000', 'stroke-width': 1.2,
    }));
    svg.appendChild(el('rect', {
      x: FB_X + 3, y: YBL - 4 * S, width: 4, height: 4 * S, fill: '#000',
    }));

    // Bar 1: target note
    drawNote(svg, N1X, ni1.p, ni1.a, '#1e90ff');

    // Bar 2: played note (coloured) or whole rest
    if (_playedMidi !== null) {
      const ni2 = NOTE_INFO[_playedMidi] ?? NOTE_INFO[64];
      drawNote(svg, N2X, ni2.p, ni2.a, _playedColor);
    } else {
      drawWholeRest(svg, N2X);
    }

    container.appendChild(svg);
  }

  return {
    renderTarget(target) {
      _target      = target;
      _playedMidi  = null;
      _playedColor = '#000';
      render();
    },
    showMatch(midi) {
      _playedMidi  = midi;
      _playedColor = '#22c55e';
      render();
    },
    showWrong(midi) {
      _playedMidi  = midi;
      _playedColor = '#ef4444';
      render();
    },
    clear() {
      _playedMidi  = null;
      _playedColor = '#000';
      render();
    },
  };
}
