/**
 * Debug control panel.
 * Builds the HTML controls and keeps a live `config` object in sync.
 * Pass the returned `config` reference to the state machine — it reads
 * current values on every step, so changes take effect immediately.
 */
export function createControls(container) {
  const config = {
    windowMs: 100,
    confirmationThreshold: 1,
    noiseGate: 0.005,
    silenceFrameThreshold: 3,
    yinThreshold: 0.2,
    clarityThreshold: 0.62,
    minFreq: 75,
    maxFreq: 450,
  };

  const rows = [
    {
      label: 'Window Length',
      type: 'select',
      key: 'windowMs',
      options: [50, 100, 150, 200, 500],
      default: 100,
      parse: Number,
    },
    {
      label: 'Confirmation Threshold',
      type: 'select',
      key: 'confirmationThreshold',
      options: [0, 1, 2, 3, 5],
      default: 1,
      parse: Number,
    },
    {
      label: 'Silence Frame Threshold',
      type: 'select',
      key: 'silenceFrameThreshold',
      options: [1, 3, 5, 10, 20],
      default: 3,
      parse: Number,
    },
    {
      label: 'RMS Noise Gate',
      type: 'number',
      key: 'noiseGate',
      min: 0.001,
      max: 0.2,
      step: 0.001,
      default: 0.005,
      parse: Number,
    },
    {
      label: 'YIN Threshold',
      type: 'number',
      key: 'yinThreshold',
      min: 0.05,
      max: 0.5,
      step: 0.01,
      default: 0.2,
      parse: Number,
    },
    {
      label: 'Clarity Threshold',
      type: 'number',
      key: 'clarityThreshold',
      min: 0.3,
      max: 0.99,
      step: 0.05,
      default: 0.62,
      parse: Number,
    },
    {
      label: 'Min Pitch (Hz)',
      type: 'number',
      key: 'minFreq',
      min: 30,
      max: 200,
      step: 1,
      default: 75,
      parse: Number,
    },
    {
      label: 'Max Pitch (Hz)',
      type: 'number',
      key: 'maxFreq',
      min: 200,
      max: 1000,
      step: 1,
      default: 450,
      parse: Number,
    },
  ];

  container.className = 'controls';

  rows.forEach((row) => {
    const label = document.createElement('label');
    label.textContent = row.label;

    let input;
    if (row.type === 'select') {
      input = document.createElement('select');
      row.options.forEach((opt) => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        if (opt === row.default) el.selected = true;
        input.appendChild(el);
      });
    } else {
      input = document.createElement('input');
      input.type = 'number';
      input.min = row.min;
      input.max = row.max;
      input.step = row.step;
      input.value = row.default;
    }

    input.addEventListener('change', () => {
      config[row.key] = row.parse(input.value);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'control-row';
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  });

  return config;
}
