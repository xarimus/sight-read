/**
 * Begin / Stop button bar.
 *
 * Returns:
 *   { onBegin(cb), onStop(cb), setRunning(bool), setBeginDisabled(bool, reason) }
 */
export function createControlsBar(container) {
  container.innerHTML = `
    <button id="begin-btn" class="begin-btn">Begin</button>
    <button id="stop-btn" class="stop-btn" style="display:none">Stop</button>
    <span class="controls-hint"></span>
  `;

  const beginBtn = container.querySelector('#begin-btn');
  const stopBtn = container.querySelector('#stop-btn');
  const hint = container.querySelector('.controls-hint');

  let _onBegin = null;
  let _onStop = null;

  beginBtn.addEventListener('click', () => _onBegin?.());
  stopBtn.addEventListener('click', () => _onStop?.());

  return {
    onBegin(cb) { _onBegin = cb; },
    onStop(cb)  { _onStop = cb; },

    setRunning(running) {
      beginBtn.style.display = running ? 'none' : '';
      stopBtn.style.display  = running ? '' : 'none';
    },

    setBeginDisabled(disabled, reason = '') {
      beginBtn.disabled = disabled;
      hint.textContent = reason;
    },
  };
}
