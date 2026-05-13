const HELP = {
  noiseGate: {
    title: 'Mic Sensitivity',
    body: 'Sets the minimum input volume before the app attempts pitch detection. Raise this (e.g. 0.005 → 0.015) if the app reacts while you are silent, to fan noise, or room hum. Lower it if quiet playing goes undetected.',
  },
  confirmationThreshold: {
    title: 'Stability (Dwell)',
    body: 'Number of consecutive audio frames the same note must be detected before the app registers it. Raise this to 3–5 if accidental string brushes or hand-thumps are giving unearned credit.',
  },
  clarityThreshold: {
    title: 'Note Clarity',
    body: 'How "pure" or periodic the sound must be before it is accepted as a pitch. Raise this if buzzy overtones or percussive strikes are triggering notes. Lower it if clean plucks are going undetected.',
  },
  silenceFrameThreshold: {
    title: 'Inter-note Delay',
    body: 'How many silent frames must pass after a note before the next note can register. Raise this if the app skips two notes at once because the first note\'s sustain is still ringing.',
  },
};

const ROWS = [
  { key: 'noiseGate',             label: 'Mic Sensitivity', min: 0.001, max: 0.050, step: 0.001, decimals: 3 },
  { key: 'confirmationThreshold', label: 'Stability',        min: 1,     max: 5,     step: 1,     decimals: 0 },
  { key: 'clarityThreshold',      label: 'Note Clarity',     min: 0.50,  max: 0.90,  step: 0.01,  decimals: 2 },
  { key: 'silenceFrameThreshold', label: 'Inter-note Delay', min: 1,     max: 10,    step: 1,     decimals: 0 },
];

export function createAdvancedPanel(container, { defaults, onChange }) {
  // Singleton popover
  const popover = document.createElement('div');
  popover.className = 'help-popover';
  popover.hidden = true;
  document.body.appendChild(popover);

  let activeBtn = null;

  function showPopover(btn, key) {
    if (activeBtn === btn) { hidePopover(); return; }
    activeBtn = btn;
    const h = HELP[key];
    popover.innerHTML = `<div class="help-popover-title">${h.title}</div><div class="help-popover-body">${h.body}</div>`;
    popover.hidden = false;
    positionPopover(btn);
  }

  function hidePopover() {
    popover.hidden = true;
    activeBtn = null;
  }

  function positionPopover(btn) {
    const rect = btn.getBoundingClientRect();
    const pw = 280;
    let left = rect.right + 8;
    if (left + pw > window.innerWidth - 8) left = rect.left - pw - 8;
    if (left < 8) left = 8;
    const top = Math.min(rect.top, window.innerHeight - popover.offsetHeight - 8);
    popover.style.left = `${left}px`;
    popover.style.top = `${Math.max(8, top)}px`;
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePopover(); });
  document.addEventListener('click', e => {
    if (!popover.hidden && !popover.contains(e.target) && !e.target.classList.contains('help-btn')) {
      hidePopover();
    }
  });

  const values = { ...defaults };
  const rows = {};

  for (const row of ROWS) {
    const el = document.createElement('div');
    el.className = 'adv-row';

    const labelEl = document.createElement('div');
    labelEl.className = 'adv-row-label';

    const labelText = document.createElement('span');
    labelText.textContent = row.label;

    const helpBtn = document.createElement('button');
    helpBtn.className = 'help-btn';
    helpBtn.type = 'button';
    helpBtn.setAttribute('aria-label', `Help for ${row.label}`);
    helpBtn.textContent = '?';
    helpBtn.addEventListener('click', e => { e.stopPropagation(); showPopover(helpBtn, row.key); });

    labelEl.appendChild(labelText);
    labelEl.appendChild(helpBtn);

    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'adv-row-slider';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = row.min;
    slider.max = row.max;
    slider.step = row.step;
    slider.value = values[row.key];

    const valueEl = document.createElement('span');
    valueEl.className = 'adv-row-value';
    valueEl.textContent = Number(values[row.key]).toFixed(row.decimals);

    slider.addEventListener('input', () => {
      const v = row.decimals === 0
        ? parseInt(slider.value, 10)
        : parseFloat(parseFloat(slider.value).toFixed(row.decimals));
      values[row.key] = v;
      valueEl.textContent = v.toFixed(row.decimals);
      onChange(row.key, v);
    });

    sliderWrap.appendChild(slider);
    sliderWrap.appendChild(valueEl);
    el.appendChild(labelEl);
    el.appendChild(sliderWrap);
    container.appendChild(el);

    rows[row.key] = { slider, valueEl, row };
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'adv-reset-btn';
  resetBtn.type = 'button';
  resetBtn.textContent = 'Reset to defaults';
  resetBtn.addEventListener('click', () => {
    for (const { key, decimals } of ROWS) {
      const v = defaults[key];
      values[key] = v;
      rows[key].slider.value = v;
      rows[key].valueEl.textContent = Number(v).toFixed(decimals);
      onChange(key, v);
    }
  });
  container.appendChild(resetBtn);

  return {
    saveState() {
      return { ...values };
    },
    restoreState(saved) {
      for (const { key, min, max, decimals } of ROWS) {
        if (saved[key] == null) continue;
        const v = Math.min(max, Math.max(min, saved[key]));
        values[key] = v;
        rows[key].slider.value = v;
        rows[key].valueEl.textContent = Number(v).toFixed(decimals);
      }
    },
  };
}
