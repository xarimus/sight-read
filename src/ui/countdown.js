/**
 * Displays a 3-2-1-Go! countdown overlay inside the given container.
 * Returns { promise, cancel() }.  Resolves when the countdown finishes OR is cancelled.
 */
export function startCountdown(container) {
  let cancelled = false;
  let _resolve;
  const promise = new Promise(r => { _resolve = r; });

  const overlay = document.createElement('div');
  overlay.className = 'countdown-overlay';
  container.appendChild(overlay);

  const steps = [
    { text: '3', ms: 1000 },
    { text: '2', ms: 1000 },
    { text: '1', ms: 1000 },
    { text: 'Go!', ms: 500 },
  ];
  let idx = 0;
  let timer = null;

  function next() {
    if (cancelled) return;
    if (idx >= steps.length) {
      overlay.remove();
      _resolve();
      return;
    }
    const { text, ms } = steps[idx++];
    overlay.textContent = text;
    // Restart the pop animation for each number
    overlay.style.animation = 'none';
    overlay.offsetHeight; // force reflow
    overlay.style.animation = '';
    timer = setTimeout(next, ms);
  }

  next();

  return {
    promise,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      clearTimeout(timer);
      overlay.remove();
      _resolve();
    },
  };
}
