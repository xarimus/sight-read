/**
 * Stats panel — live readout during drill, frozen "last drill" after stop.
 *
 * Returns: { startLive(getSnapshot, getProgress), stopLive(), showLast(snapshot) }
 */
export function createStatsPanel(container) {
  container.innerHTML = `
    <div class="stats-section stats-live" style="display:none">
      <div class="stats-title">Live</div>
      <div class="stats-grid">
        <span class="stats-key">Elapsed</span><span class="stats-val" id="s-elapsed">—</span>
        <span class="stats-key">Targets</span><span class="stats-val" id="s-targets">—</span>
        <span class="stats-key">Played</span><span class="stats-val" id="s-played">—</span>
        <span class="stats-key">1st-try</span><span class="stats-val" id="s-acc">—</span>
        <span class="stats-key">Stars</span><span class="stats-val stats-stars" id="s-stars">—</span>
      </div>
    </div>
    <div class="stats-section stats-last" style="display:none">
      <div class="stats-title">Last drill</div>
      <div class="stats-grid">
        <span class="stats-key">Elapsed</span><span class="stats-val" id="sl-elapsed">—</span>
        <span class="stats-key">Targets</span><span class="stats-val" id="sl-targets">—</span>
        <span class="stats-key">Played</span><span class="stats-val" id="sl-played">—</span>
        <span class="stats-key">1st-try</span><span class="stats-val" id="sl-acc">—</span>
        <span class="stats-key">Stars</span><span class="stats-val stats-stars" id="sl-stars">—</span>
      </div>
    </div>
  `;

  const liveSection = container.querySelector('.stats-live');
  const lastSection = container.querySelector('.stats-last');

  let _interval = null;

  function renderStars(n) {
    if (n === 0) return '—';
    return '★'.repeat(n) + '☆'.repeat(3 - n);
  }

  function fmt(snapshot, getProgress) {
    const elapsed = snapshot.elapsedSec;
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(Math.floor(elapsed % 60)).padStart(2, '0');

    const prog = getProgress?.();
    let targets;
    if (!prog) {
      targets = String(snapshot.targetsCompleted);
    } else if (prog.unit === 'count') {
      targets = `${snapshot.targetsCompleted} / ${prog.total}`;
    } else {
      targets = String(snapshot.targetsCompleted);
    }

    const acc = snapshot.firstTryAccuracy != null
      ? `${Math.round(snapshot.firstTryAccuracy * 100)}%`
      : '—';

    return {
      elapsed: `${mm}:${ss}`,
      targets,
      played: String(snapshot.notesPlayed),
      acc,
      stars: renderStars(snapshot.stars ?? 0),
    };
  }

  function writeFields(prefix, fields) {
    container.querySelector(`#${prefix}-elapsed`).textContent = fields.elapsed;
    container.querySelector(`#${prefix}-targets`).textContent = fields.targets;
    container.querySelector(`#${prefix}-played`).textContent  = fields.played;
    container.querySelector(`#${prefix}-acc`).textContent     = fields.acc;
    container.querySelector(`#${prefix}-stars`).textContent   = fields.stars;
  }

  return {
    startLive(getSnapshot, getProgress) {
      liveSection.style.display = '';
      lastSection.style.display = 'none';
      _interval = setInterval(() => {
        writeFields('s', fmt(getSnapshot(), getProgress));
      }, 250);
    },

    stopLive() {
      clearInterval(_interval);
      _interval = null;
      liveSection.style.display = 'none';
    },

    showLast(snapshot) {
      lastSection.style.display = '';
      writeFields('sl', fmt(snapshot, null));
    },
  };
}
