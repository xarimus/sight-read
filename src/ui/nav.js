export function createNav(container, { onAbout } = {}) {
  container.innerHTML = `
    <span class="nav-title">Classical Guitar Sight-Reading Drills</span>
    <div class="nav-right">
      <button class="nav-about" title="Design rationale">?</button>
      <a class="nav-debug" href="/debug.html" target="_blank" rel="noopener">Debug ↗</a>
    </div>
  `;

  if (onAbout) {
    container.querySelector('.nav-about').addEventListener('click', onAbout);
  }
}
