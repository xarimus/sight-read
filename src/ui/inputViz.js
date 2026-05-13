import { createCentsDisplay } from './cents.js';
import { createWaveformTrace } from './trace.js';

/**
 * Input visualizer — two modes:
 *
 *  - Tuner mode (default, no drill running): displays detected note name + cents needle.
 *    An "Enable Mic" button prompts for permission; afterwards the display updates live.
 *
 *  - Drill mode (while a drill is active): displays cents needle + waveform trace.
 *    Switched via setMode('drill') / setMode('tuner').
 *
 * Returns:
 *   { updateCents, setNoiseGate, startTrace, stopTrace,
 *     setMode, showTunerNote, onEnableMic, onToggle, hidden, advancedContainer }
 */
export function createInputViz(container) {
  container.innerHTML = `
    <button class="viz-toggle" aria-expanded="true" title="Hide input panel">Input ▾</button>
    <div class="viz-body">
      <div class="tuner-note-name">—</div>
      <div class="viz-section">
        <span class="viz-label">Intonation</span>
        <canvas id="cents-canvas" width="196" height="40"></canvas>
      </div>
      <button class="tuner-enable-btn">Enable Mic</button>
      <div class="viz-section viz-waveform" style="display:none">
        <span class="viz-label">Waveform</span>
        <canvas id="trace-canvas" width="196" height="60"></canvas>
      </div>
      <details class="advanced-block">
        <summary class="advanced-block-title">Advanced</summary>
        <div class="advanced-body"></div>
      </details>
    </div>
  `;

  const toggleBtn     = container.querySelector('.viz-toggle');
  const tunerName     = container.querySelector('.tuner-note-name');
  const enableBtn     = container.querySelector('.tuner-enable-btn');
  const waveformDiv   = container.querySelector('.viz-waveform');
  const centsCanvas   = container.querySelector('#cents-canvas');
  const traceCanvas   = container.querySelector('#trace-canvas');
  const advancedBody  = container.querySelector('.advanced-body');

  const centsDisplay = createCentsDisplay(centsCanvas);
  let _trace = null;
  let _hidden = false;
  let _onToggle = null;
  let _onEnableMic = null;
  let _mode = 'tuner'; // 'tuner' | 'drill'
  let _micEnabled = false;

  toggleBtn.addEventListener('click', () => {
    _hidden = !_hidden;
    container.dataset.hidden = _hidden;
    document.body.classList.toggle('viz-hidden', _hidden);
    toggleBtn.setAttribute('aria-expanded', String(!_hidden));
    toggleBtn.textContent = _hidden ? 'Input ▸' : 'Input ▾';
    _onToggle?.(_hidden);
  });

  enableBtn.addEventListener('click', async () => {
    enableBtn.disabled = true;
    enableBtn.textContent = 'Enabling…';
    try {
      await _onEnableMic?.();
      _micEnabled = true;
      enableBtn.style.display = 'none';
      tunerName.style.display = '';
    } catch {
      enableBtn.disabled = false;
      enableBtn.textContent = 'Error — retry?';
    }
  });

  return {
    updateCents(cents) { centsDisplay.update(cents); },

    setNoiseGate(val) { _trace?.setNoiseGate(val); },

    startTrace(analyser) {
      _trace = createWaveformTrace(traceCanvas, analyser);
    },

    stopTrace() {
      _trace?.stop();
      _trace = null;
    },

    setMode(mode) {
      _mode = mode;
      if (mode === 'drill') {
        tunerName.style.display = 'none';
        enableBtn.style.display = 'none';
        waveformDiv.style.display = '';
      } else {
        tunerName.style.display = _micEnabled ? '' : 'none';
        enableBtn.style.display = _micEnabled ? 'none' : '';
        waveformDiv.style.display = 'none';
      }
    },

    showTunerNote(noteName) {
      tunerName.textContent = noteName ?? '—';
    },

    onEnableMic(cb) { _onEnableMic = cb; },

    get hidden() { return _hidden; },
    onToggle(cb) { _onToggle = cb; },
    advancedContainer: advancedBody,
  };
}
