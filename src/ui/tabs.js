/**
 * Two-tab widget. Tabs hide/show their matching panel.
 *
 * Usage:
 *   createTabs(container, [
 *     { id: 'presets', label: 'Presets', content: presetsEl },
 *     { id: 'custom',  label: 'Custom',  content: customEl  },
 *   ], { defaultTab: 'presets', onSwitch(id) {} })
 */
export function createTabs(container, tabDefs, { defaultTab, onSwitch } = {}) {
  const bar = document.createElement('div');
  bar.className = 'tab-bar';

  tabDefs.forEach(({ id, label, content }) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.dataset.tab = id;
    btn.textContent = label;
    bar.appendChild(btn);

    content.classList.add('tab-panel');
    content.dataset.tab = id;
    container.appendChild(content);
  });

  container.prepend(bar);

  function activate(id) {
    bar.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('tab-btn--active', b.dataset.tab === id);
    });
    container.querySelectorAll('.tab-panel').forEach(p => {
      p.style.display = p.dataset.tab === id ? '' : 'none';
    });
    onSwitch?.(id);
  }

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (btn) activate(btn.dataset.tab);
  });

  activate(defaultTab ?? tabDefs[0].id);

  return { activate };
}
