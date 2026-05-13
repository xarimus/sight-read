import { initAudio } from './audio.js';
import { createYinDetector } from './pitch/index.js';
import { createTargetSource } from './state/targets.js';
import { createState, step } from './state/matchLockRelease.js';
import { createStaff } from './render/staff.js';
import { createControls } from './ui/controls.js';
import { createCentsDisplay } from './ui/cents.js';
import { createWaveformTrace } from './ui/trace.js';

async function main() {
  const statusEl = document.getElementById('status');
  const targetLabelEl = document.getElementById('target-label');
  const progressEl = document.getElementById('progress');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const staffContainer = document.getElementById('staff-container');
  const centsCanvas = document.getElementById('cents-canvas');
  const traceCanvas = document.getElementById('trace-canvas');
  const controlsContainer = document.getElementById('controls-container');

  const config = createControls(controlsContainer);
  const centsDisplay = createCentsDisplay(centsCanvas);

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    statusEl.textContent = 'Requesting microphone access…';

    let audio;
    try {
      audio = await initAudio();
    } catch (err) {
      statusEl.textContent = `Microphone error: ${err.message}`;
      startBtn.disabled = false;
      return;
    }

    statusEl.textContent = 'Loading staff renderer…';

    const staff = createStaff(staffContainer);
    const trace = createWaveformTrace(traceCanvas, audio.analyser);
    const detector = createYinDetector();
    const targets = createTargetSource();

    // Keep trace in sync with noise gate setting
    let _noiseGate = config.noiseGate;
    Object.defineProperty(config, 'noiseGate', {
      get() { return _noiseGate; },
      set(v) { _noiseGate = v; trace.setNoiseGate(v); },
      configurable: true,
    });
    trace.setNoiseGate(config.noiseGate);

    let mlrState = createState();

    function renderCurrentTarget() {
      const t = targets.current();
      staff.renderTarget(t);
      targetLabelEl.textContent = t.label;
      progressEl.textContent = `${targets.position + 1} / ${targets.total}`;
    }

    renderCurrentTarget();
    statusEl.textContent = 'Listening…';
    stopBtn.style.display = 'inline-block';

    stopBtn.onclick = () => {
      audio.stop();
      trace.stop();
      stopBtn.style.display = 'none';
      startBtn.disabled = false;
      statusEl.textContent = 'Press Start to begin';
      targetLabelEl.textContent = '—';
      progressEl.textContent = '';
      staffContainer.innerHTML = '';

    };

    // Ring buffer for YIN: keep the last N samples where N = max window size
    const MAX_SAMPLES = Math.ceil(audio.audioContext.sampleRate * 0.5); // 500 ms
    const ringBuf = new Float32Array(MAX_SAMPLES);
    let ringHead = 0;
    let ringFilled = 0;

    audio.onSamples((chunk) => {
      // Write chunk into ring buffer
      for (let i = 0; i < chunk.length; i++) {
        ringBuf[ringHead] = chunk[i];
        ringHead = (ringHead + 1) % MAX_SAMPLES;
        if (ringFilled < MAX_SAMPLES) ringFilled++;
      }

      // Extract most recent windowSamples for YIN
      const windowSamples = Math.ceil(
        audio.audioContext.sampleRate * (config.windowMs / 1000)
      );
      const available = Math.min(ringFilled, windowSamples);
      const window = new Float32Array(available);
      for (let i = 0; i < available; i++) {
        const idx = (ringHead - available + i + MAX_SAMPLES) % MAX_SAMPLES;
        window[i] = ringBuf[idx];
      }

      const result = detector.detect(window, audio.audioContext.sampleRate, {
        threshold: config.yinThreshold,
        minFreq: config.minFreq,
        maxFreq: config.maxFreq,
      });

      let event;
      if (!result || result.rms < config.noiseGate) {
        event = { type: 'silence', rms: result ? result.rms : 0 };
        centsDisplay.update(null);
      } else {
        const continuousMidi = 69 + 12 * Math.log2(result.frequency / 440);
        const midi = Math.round(continuousMidi);
        const cents = (continuousMidi - midi) * 100;
        event = { type: 'pitch', midi, cents, clarity: result.clarity, rms: result.rms };
        centsDisplay.update(cents);
      }

      const target = targets.current();
      const { state: newState, output } = step(mlrState, event, target.midi, config);
      mlrState = newState;

      if (output) {
        if (output.type === 'MATCH') {
          staff.showMatch(event.midi);
          statusEl.textContent = `✓ ${target.label}`;
        } else if (output.type === 'WRONG') {
          staff.showWrong(output.midi);
          statusEl.textContent = `✗ wrong note`;
        } else if (output.type === 'RELEASE') {
          targets.advance();
          renderCurrentTarget();
          statusEl.textContent = 'Listening…';
        }
      }
    });
  });
}

main();
