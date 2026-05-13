/**
 * Mobile bottom nav — opens/closes side drawers for viz, panel, and stats.
 * Only active below the 768px breakpoint; on desktop the container stays empty.
 */
export function createMobileNav(container, { vizEl, panelEl, statsEl }) {
  container.innerHTML = `
    <button class="mnav-btn" data-target="viz">Input</button>
    <button class="mnav-btn" data-target="panel">Presets</button>
    <button class="mnav-btn" data-target="stats">Stats</button>
  `;

  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  document.body.appendChild(backdrop);

  const drawers = { viz: vizEl, panel: panelEl, stats: statsEl };
  let openTarget = null;

  function closeAll() {
    Object.values(drawers).forEach(el => el.classList.remove('drawer-open'));
    backdrop.classList.remove('drawer-backdrop--visible');
    container.querySelectorAll('.mnav-btn').forEach(b => b.classList.remove('mnav-btn--active'));
    openTarget = null;
  }

  function toggle(target) {
    if (openTarget === target) {
      closeAll();
    } else {
      closeAll();
      drawers[target].classList.add('drawer-open');
      backdrop.classList.add('drawer-backdrop--visible');
      container.querySelector(`[data-target="${target}"]`).classList.add('mnav-btn--active');
      openTarget = target;
    }
  }

  container.querySelectorAll('.mnav-btn').forEach(btn => {
    btn.addEventListener('click', () => toggle(btn.dataset.target));
  });

  backdrop.addEventListener('click', closeAll);
}
