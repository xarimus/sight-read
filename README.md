# sight-read

A classical guitar sight-reading trainer that listens to your playing in real time, detects pitch via microphone, and gives immediate feedback against a target note displayed on a music staff.

**Live demo:** https://sightread.candae.com

---

## How it works

1. Select a drill preset (or build a custom note set from the fretboard).
2. Click **Begin** — a target note appears on the staff.
3. Play the note on your guitar. The app detects your pitch and highlights the staff green (correct) or red (wrong).
4. Hold the note until it locks in, then release. The next note appears automatically.
5. Your accuracy, speed, and star rating are tracked in real time.

A built-in tuner runs before and after drills so you can confirm your guitar is in tune.

---

## Drill presets

19 presets organized in 6 progressive blocks:

| Block | Focus |
|-------|-------|
| 1 | Isolated strings — one string at a time |
| 2 | String-crossing — naturals, spatial jumps |
| 3 | All naturals across all 6 strings (16 notes) |
| 4 | Accidentals — F♯, C♯, B♭, E♭, and more |
| 5 | Full chromatic — all 29 first-position notes |
| 6 | Elite — wide jumps, ledger lines |

All drills cover first position only. This is intentional: eliminating fretboard redundancy gives beginners a clean 1:1 mapping between staff notation and finger placement.

---

## Getting started

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # Production build → /dist
```

A second entry point at `debug.html` renders a development console overlay for inspecting pitch detection state and live-tuning configuration constants.

---

## Architecture

**Stack:** Vite · AlphaTab · Web Audio API · plain ES6 modules (no framework)

```
getUserMedia (mono, 22050 Hz)
  → AudioWorklet sampler
    → ring buffer (500 ms)
      → YIN pitch detector (100 ms windows)
        → MIDI + cents + clarity
          → match-lock-release state machine
            → staff rendering + stats UI
```

### Pitch detection

YIN (de Cheveigné & Kawahara 2002), implemented in `src/pitch/yin.js`. Chosen for sub-millisecond latency, no model file, and a free cents-offset reading that doubles as tuner accuracy. Tuned for guitar range: 75–450 Hz (E2–A4).

The detector is swappable — `src/pitch/index.js` is a factory. A different algorithm (BasicPitch, CREPE) can be plugged in by implementing the same `{ frequency, clarity, rms }` interface.

### State machine

`src/state/matchLockRelease.js` drives the drill loop through four phases:

- **IDLE** — waiting for microphone input
- **MATCH** — pitch confirmed within ±50 cents for N frames (~100 ms each)
- **LOCKED** — correct note held; waiting for silence
- **RELEASE** — N frames of silence detected; advances to next target

This prevents false advances on pitch transients between notes. The `step()` function is pure and independently testable.

### Staff rendering

AlphaTab (`@coderline/alphatab`) renders a single-staff score with no tablature — deliberate, to train staff reading rather than tab dependency. Notes are colored in real time via AlphaTab's style API (green = correct, red = wrong).

### Persistence

All session state is saved to `localStorage['sightread:v1']`: preset selections, custom fretboard state, best star scores, visualization toggle, and advanced tuning parameters.

---

## Configuration

Key tuning constants live at the top of `src/main.js`:

| Constant | Default | Description |
|----------|---------|-------------|
| `windowMs` | 100 | Sample window size (ms) |
| `confirmationThreshold` | 1 | Frames to confirm a pitch match |
| `noiseGate` | 0.005 | RMS threshold for silence detection |
| `silenceFrameThreshold` | 3 | Silence frames needed to trigger release |
| `clarityThreshold` | 0.62 | Minimum YIN clarity to accept a match |
| `yinThreshold` | 0.2 | YIN algorithm internal threshold |
| `minFreq` / `maxFreq` | 75 / 450 | Frequency bounds (Hz) |

These were calibrated for acoustic guitar in a typical room. The **Advanced** panel in the UI exposes these at runtime for different acoustic environments.

---

## License

MIT © 2026 Aaron Haskett
