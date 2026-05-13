import { PRESETS, BLOCK_TITLES } from '../state/presets.js';

/**
 * Presets panel — block-grouped collapsible chip list + stop-condition selector.
 *
 * Returns:
 *   { getSelection(), setDisabled(bool), setBestStars(obj), restoreState(saved), saveState() }
 */
export function createPresetsPanel(container) {
  container.innerHTML = `
    <div class="preset-blocks"></div>
    <div class="stop-row">
      <span class="stop-label">Stop after</span>
      <div class="stop-options">
        <label class="stop-opt"><input type="radio" name="preset-stop" value="count"> Notes</label>
        <label class="stop-opt"><input type="radio" name="preset-stop" value="time" checked> Time</label>
        <label class="stop-opt"><input type="radio" name="preset-stop" value="endless"> Endless</label>
      </div>
      <input class="stop-num" type="number" min="1" max="9999" value="60">
      <span class="stop-unit">notes</span>
    </div>
  `;

  const blocksEl = container.querySelector('.preset-blocks');
  const stopNum  = container.querySelector('.stop-num');
  const stopUnit = container.querySelector('.stop-unit');
  const radios   = container.querySelectorAll('input[name="preset-stop"]');

  let _selectedId = PRESETS[0].id;

  // Group presets by block number
  const byBlock = {};
  for (const preset of PRESETS) {
    (byBlock[preset.block] ??= []).push(preset);
  }

  // Render one <details> section per block
  for (const blockNum of Object.keys(byBlock).map(Number).sort((a, b) => a - b)) {
    const presetGroup = byBlock[blockNum];
    const details = document.createElement('details');
    details.className = 'preset-block';
    details.dataset.block = blockNum;
    if (blockNum === 1) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'preset-block-title';
    summary.textContent = BLOCK_TITLES[blockNum] ?? `Block ${blockNum}`;
    details.appendChild(summary);

    const chipList = document.createElement('div');
    chipList.className = 'preset-chip-list';
    for (const preset of presetGroup) {
      const chip = document.createElement('button');
      chip.className = 'preset-chip';
      chip.dataset.id = preset.id;
      chip.innerHTML = `<span class="chip-label">${preset.label}</span>`;
      chip.addEventListener('click', () => selectChip(preset.id));
      chipList.appendChild(chip);
    }
    details.appendChild(chipList);
    blocksEl.appendChild(details);
  }

  function selectChip(id) {
    _selectedId = id;
    blocksEl.querySelectorAll('.preset-chip').forEach(c => {
      c.classList.toggle('preset-chip--active', c.dataset.id === id);
    });
  }

  selectChip(_selectedId);

  // Stop-condition controls
  function getStopType() {
    return [...radios].find(r => r.checked)?.value ?? 'count';
  }

  radios.forEach(r => r.addEventListener('change', () => {
    const type = getStopType();
    stopNum.style.display = type === 'endless' ? 'none' : '';
    stopUnit.textContent  = type === 'time' ? 'seconds' : 'notes';
    stopNum.value         = type === 'time' ? 60 : 45;
  }));

  return {
    getSelection() {
      const preset = PRESETS.find(p => p.id === _selectedId) ?? PRESETS[0];
      const type = getStopType();
      let stopSpec;
      if (type === 'endless') {
        stopSpec = { type: 'endless' };
      } else if (type === 'time') {
        stopSpec = { type: 'time', seconds: Math.max(1, Number(stopNum.value)) };
      } else {
        stopSpec = { type: 'count', count: Math.max(1, Number(stopNum.value)) };
      }
      return { preset, stopSpec };
    },

    setBestStars(bestStars) {
      const stars = bestStars ?? {};
      blocksEl.querySelectorAll('.preset-chip').forEach(chip => {
        const id = chip.dataset.id;
        const n = stars[id] ?? 0;
        const existing = chip.querySelector('.chip-stars');
        if (existing) existing.remove();
        if (n > 0) {
          const badge = document.createElement('span');
          badge.className = 'chip-stars';
          badge.textContent = '★'.repeat(n);
          chip.appendChild(badge);
        }
      });
    },

    setDisabled(disabled) {
      blocksEl.querySelectorAll('.preset-chip').forEach(c => { c.disabled = disabled; });
      radios.forEach(r => { r.disabled = disabled; });
      stopNum.disabled = disabled;
    },

    restoreState(saved) {
      if (saved?.presetId) {
        selectChip(saved.presetId);
        const preset = PRESETS.find(p => p.id === saved.presetId);
        if (preset) {
          blocksEl.querySelectorAll('.preset-block').forEach(d => { d.open = false; });
          const details = blocksEl.querySelector(`[data-block="${preset.block}"]`);
          if (details) details.open = true;
        }
      }
      if (saved?.stop) {
        const radio = [...radios].find(r => r.value === saved.stop.type);
        if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
        if (saved.stop.seconds != null) stopNum.value = saved.stop.seconds;
        if (saved.stop.count   != null) stopNum.value = saved.stop.count;
      }
    },

    saveState() {
      const type = getStopType();
      const stop = type === 'endless' ? { type } :
                   type === 'time'    ? { type, seconds: Number(stopNum.value) } :
                                        { type, count:   Number(stopNum.value) };
      return { presetId: _selectedId, stop };
    },
  };
}
