import { initAudio } from './audio.js';
import { createYinDetector } from './pitch/index.js';
import { createPoolTargetSource } from './state/targets.js';
import { createState, step } from './state/matchLockRelease.js';
import { buildPool } from './state/pool.js';
import { createStopCondition } from './state/stopCondition.js';
import { createStats } from './state/stats.js';
import { createStaff } from './render/staff.js';
import { createNav } from './ui/nav.js';
import { createInputViz } from './ui/inputViz.js';
import { createTabs } from './ui/tabs.js';
import { createPresetsPanel } from './ui/presetsPanel.js';
import { createCustomPanel } from './ui/customPanel.js';
import { createControlsBar } from './ui/controlsBar.js';
import { createStatsPanel } from './ui/statsPanel.js';
import { createFooter } from './ui/footer.js';
import { startCountdown } from './ui/countdown.js';
import { createReferenceModal } from './ui/referenceModal.js';
import { createMobileNav } from './ui/mobileNav.js';
import { createAdvancedPanel } from './ui/advancedPanel.js';

// Tuned defaults — keep in sync with debug page's controls.js
const CONFIG = {
  windowMs: 100,
  confirmationThreshold: 1,
  noiseGate: 0.005,
  silenceFrameThreshold: 3,
  yinThreshold: 0.2,
  clarityThreshold: 0.62,
  minFreq: 75,
  maxFreq: 450,
};

const STORAGE_KEY = 'sightread:v1';

function loadStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
}
function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* quota */ }
}

async function main() {
  // Mount static UI
  const referenceModal = createReferenceModal();
  createNav(document.getElementById('nav'), { onAbout: () => referenceModal.show() });
  createFooter(document.getElementById('footer'));
  createMobileNav(document.getElementById('mobile-nav'), {
    vizEl:   document.getElementById('viz-col'),
    panelEl: document.getElementById('panel-col'),
    statsEl: document.getElementById('stats-panel'),
  });

  const viz = createInputViz(document.getElementById('viz-col'));

  const ADVANCED_DEFAULTS = {
    noiseGate: CONFIG.noiseGate,
    confirmationThreshold: CONFIG.confirmationThreshold,
    clarityThreshold: CONFIG.clarityThreshold,
    silenceFrameThreshold: CONFIG.silenceFrameThreshold,
  };

  const advancedPanel = createAdvancedPanel(viz.advancedContainer, {
    defaults: ADVANCED_DEFAULTS,
    onChange(key, value) {
      CONFIG[key] = value;
      if (key === 'noiseGate') viz.setNoiseGate(value);
      saveStorage({ ...loadStorage(), advanced: advancedPanel.saveState() });
    },
  });

  const presetsEl = document.getElementById('presets-panel');
  const customEl  = document.getElementById('custom-panel');
  const controlsBar = createControlsBar(document.getElementById('controls-bar'));
  const statsPanel  = createStatsPanel(document.getElementById('stats-panel'));
  const presets = createPresetsPanel(presetsEl);
  const custom  = createCustomPanel(customEl);

  const tabs = createTabs(
    document.getElementById('panel-col'),
    [
      { id: 'presets', label: 'Presets', content: presetsEl },
      { id: 'custom',  label: 'Custom',  content: customEl  },
    ],
    {
      defaultTab: 'presets',
      onSwitch(id) {
        updateBeginState(id);
        const s = loadStorage();
        saveStorage({ ...s, activeTab: id });
      },
    }
  );

  // Restore persisted state
  const saved = loadStorage();
  if (saved.presets) presets.restoreState(saved.presets);
  if (saved.custom)  custom.restoreState(saved.custom);
  if (saved.activeTab === 'custom') tabs.activate('custom');
  if (saved.bestStars) presets.setBestStars(saved.bestStars);
  if (saved.vizHidden) {
    document.getElementById('viz-col').dataset.hidden = 'true';
    document.body.classList.add('viz-hidden');
  }
  if (saved.advanced) {
    advancedPanel.restoreState(saved.advanced);
    Object.assign(CONFIG, advancedPanel.saveState());
  }

  // Persist viz toggle
  viz.onToggle(hidden => {
    saveStorage({ ...loadStorage(), vizHidden: hidden });
  });

  // --- Tuner ---
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const tunerDetector = createYinDetector();
  let sharedAudio = null;
  let tunerCallback = null;

  viz.onEnableMic(async () => {
    sharedAudio = await initAudio();
    tunerCallback = (chunk) => {
      const result = tunerDetector.detect(chunk, sharedAudio.audioContext.sampleRate, {
        threshold: CONFIG.yinThreshold,
        minFreq: CONFIG.minFreq,
        maxFreq: CONFIG.maxFreq,
      });
      if (result && result.rms >= CONFIG.noiseGate) {
        const cont = 69 + 12 * Math.log2(result.frequency / 440);
        const midi = Math.round(cont);
        const cents = (cont - midi) * 100;
        const noteName = NOTE_NAMES[midi % 12] + String(Math.floor(midi / 12) - 1);
        viz.showTunerNote(noteName);
        viz.updateCents(cents);
      } else {
        viz.showTunerNote(null);
        viz.updateCents(null);
      }
    };
    sharedAudio.onSamples(tunerCallback);
  });

  // Custom pool change → re-evaluate Begin button
  custom.onPoolChange(() => {
    const s = loadStorage();
    saveStorage({ ...s, custom: custom.saveState() });
    updateBeginState(activeTab());
  });

  function activeTab() {
    return document.querySelector('.tab-btn--active')?.dataset.tab ?? 'presets';
  }

  function updateBeginState(tab) {
    if (tab === 'custom') {
      const empty = custom.size === 0;
      controlsBar.setBeginDisabled(empty, empty ? 'Select at least one note' : '');
    } else {
      controlsBar.setBeginDisabled(false, '');
    }
  }

  updateBeginState('presets');

  // --- Drill session ---
  let stopSession = null; // called to teardown a running session

  controlsBar.onBegin(async () => {
    const tab = activeTab();
    let midiPool;
    let stopSpec;

    let targetMode = 'random';
    let minInterval = 7;

    if (tab === 'presets') {
      const { preset, stopSpec: ps } = presets.getSelection();
      stopSpec = ps;
      targetMode = preset.targetMode ?? 'random';
      minInterval = preset.minInterval ?? 7;
      const individualOverrides = new Map();
      for (const midi of (preset.overrides?.onMidis ?? [])) individualOverrides.set(midi, 'on');
      for (const midi of (preset.overrides?.offMidis ?? [])) individualOverrides.set(midi, 'off');
      midiPool = buildPool({
        strings: new Set(preset.strings ?? []),
        accidentalsByString: new Set(preset.accidentals ?? []),
        individualOverrides,
      });
      saveStorage({ ...loadStorage(), presets: presets.saveState() });
    } else {
      const { midiSet, stopSpec: cs } = custom.getSelection();
      stopSpec = cs;
      midiPool = [...midiSet];
      saveStorage({ ...loadStorage(), custom: custom.saveState() });
    }

    if (midiPool.length === 0) return;

    controlsBar.setRunning(true);
    presets.setDisabled(true);
    custom.setDisabled(true);

    // Reuse the tuner's audio context if the mic is already active.
    let audio;
    if (sharedAudio) {
      audio = sharedAudio;
    } else {
      try {
        audio = await initAudio();
        sharedAudio = audio;
      } catch (err) {
        controlsBar.setRunning(false);
        presets.setDisabled(false);
        custom.setDisabled(false);
        controlsBar.setBeginDisabled(false, `Mic error: ${err.message}`);
        return;
      }
    }

    const detector   = createYinDetector();
    const targets    = targetMode === 'random-min-interval'
      ? createPoolTargetSource(midiPool, { minIntervalSemitones: minInterval })
      : createPoolTargetSource(midiPool);
    const stopCond   = createStopCondition(stopSpec);

    viz.startTrace(audio.analyser);
    viz.setNoiseGate(CONFIG.noiseGate);

    let mlrState = createState();
    let staff = null;
    let stats = null;

    function renderCurrent() {
      const t = targets.current();
      staff.renderTarget(t);
      stats.onTargetShown();
    }

    let countdownHandle = null;

    function teardown(reason) {
      if (!stopSession) return;
      stopSession = null;
      countdownHandle?.cancel();
      if (tunerCallback) {
        // Audio is shared with the tuner; restore tuner callback instead of stopping.
        audio.onSamples(tunerCallback);
        viz.setMode('tuner');
        viz.showTunerNote(null);
      } else {
        audio.stop();
        sharedAudio = null;
      }
      viz.stopTrace();

      if (stats) {
        stats.freeze();
        statsPanel.stopLive();
        const frozen = stats.frozen();
        statsPanel.showLast(frozen);

        // Persist best star rating per preset
        if (tab === 'presets' && frozen && frozen.stars > 0) {
          const s = loadStorage();
          const presetId = presets.saveState().presetId;
          const bestStars = { ...(s.bestStars ?? {}) };
          bestStars[presetId] = Math.max(bestStars[presetId] ?? 0, frozen.stars);
          saveStorage({ ...s, bestStars });
          presets.setBestStars(bestStars);
        }
      }

      controlsBar.setRunning(false);
      presets.setDisabled(false);
      custom.setDisabled(false);
      updateBeginState(activeTab());
      document.getElementById('score-col').innerHTML = '';
    }

    stopSession = teardown;
    controlsBar.onStop(() => teardown('manual'));

    // 3-second countdown over an empty score area.
    countdownHandle = startCountdown(document.getElementById('score-col'));
    await countdownHandle.promise;
    countdownHandle = null;

    // If the user stopped during the countdown, bail out.
    if (!stopSession) return;

    // Build staff and start stats only after the countdown so the score is
    // clean during the overlay and elapsed time reflects actual play time.
    staff = createStaff(document.getElementById('score-col'));
    stats = createStats();
    renderCurrent();
    statsPanel.startLive(
      () => stats.snapshot(),
      () => stopCond.progress()
    );

    viz.setMode('drill');

    // Ring buffer for YIN
    const MAX_SAMPLES = Math.ceil(audio.audioContext.sampleRate * 0.5);
    const ring = new Float32Array(MAX_SAMPLES);
    let ringHead = 0;
    let ringFilled = 0;

    audio.onSamples((chunk) => {
      for (let i = 0; i < chunk.length; i++) {
        ring[ringHead] = chunk[i];
        ringHead = (ringHead + 1) % MAX_SAMPLES;
        if (ringFilled < MAX_SAMPLES) ringFilled++;
      }

      const winSamples = Math.ceil(audio.audioContext.sampleRate * CONFIG.windowMs / 1000);
      const avail = Math.min(ringFilled, winSamples);
      const win = new Float32Array(avail);
      for (let i = 0; i < avail; i++) {
        win[i] = ring[(ringHead - avail + i + MAX_SAMPLES) % MAX_SAMPLES];
      }

      const result = detector.detect(win, audio.audioContext.sampleRate, {
        threshold: CONFIG.yinThreshold,
        minFreq: CONFIG.minFreq,
        maxFreq: CONFIG.maxFreq,
      });

      let event;
      if (!result || result.rms < CONFIG.noiseGate) {
        event = { type: 'silence', rms: result ? result.rms : 0 };
        viz.updateCents(null);
      } else {
        const cont = 69 + 12 * Math.log2(result.frequency / 440);
        const midi = Math.round(cont);
        const cents = (cont - midi) * 100;
        event = { type: 'pitch', midi, cents, clarity: result.clarity, rms: result.rms };
        viz.updateCents(cents);
      }

      const target = targets.current();
      const { state: ns, output } = step(mlrState, event, target.midi, CONFIG);
      mlrState = ns;

      if (output) {
        if (output.type === 'MATCH') {
          staff.showMatch(event.midi);
          stats.onMatch();
        } else if (output.type === 'WRONG') {
          staff.showWrong(output.midi);
          stats.onWrong();
        } else if (output.type === 'RELEASE') {
          targets.advance();
          stopCond.onTargetAdvance();
          if (stopCond.shouldStop()) {
            teardown('auto');
            return;
          }
          renderCurrent();
          mlrState = createState();
        }
      }
    });
  });
}

main();
