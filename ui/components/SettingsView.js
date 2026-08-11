import { handleArchivePanelClick, renderArchivePanel } from './settings/ArchivePanel.js';
import { handleTrashPanelClick, renderTrashPanel } from './settings/TrashPanel.js';

export function renderSettingsView(root, app) {
  root.innerHTML = `
    <div class="page-heading"><div><span class="eyebrow">Workspace</span><h1>Settings</h1></div></div>
    <div class="settings-stack">
      <section class="dashboard-card"><div class="dashboard-card-head"><div><span class="eyebrow">Archive</span><h2>Archived items</h2></div></div><div class="settings-groups" data-archives></div></section>
      <section class="dashboard-card trash-group" data-trash-group aria-expanded="false">
        <div class="dashboard-card-head trash-heading" data-toggle-trash role="button" tabindex="0"><div class="trash-title"><span class="trash-icon">♲</span><div><span class="eyebrow">Project basket</span><h2>Deleted projects</h2></div></div><div class="trash-heading-meta"><span class="dashboard-count" data-trash-count></span><span class="group-chevron">⌄</span></div></div>
        <div data-trash-content hidden><p class="settings-note">Open any project to review its details, or restore it. Permanent deletion cannot be undone.</p><div class="settings-list trash-list" data-trash-list></div><div class="trash-footer"><button class="secondary-action danger-action" type="button" data-empty-trash>Delete all permanently</button></div></div>
      </section>
      <section class="dashboard-card settings-placeholder"><span class="eyebrow">More settings</span><h2>Workspace options</h2><p>New account, appearance and workflow options can be added here next.</p></section>
    </div>`;

  const refresh = () => {
    const state = app.state.get();
    renderArchivePanel(root.querySelector('[data-archives]'), state);
    renderTrashPanel(root.querySelector('[data-trash-group]'), state);
  };
  const handleClick = event => handleArchivePanelClick(event, app) || handleTrashPanelClick(event, app);
  const handleKeydown = event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const trigger = event.target.closest('[data-toggle-archive-group],[data-toggle-trash]');
    if (!trigger) return;
    event.preventDefault();
    trigger.click();
  };
  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);
  refresh();
  const unsubscribe = app.state.subscribe(refresh);
  return () => { unsubscribe(); root.removeEventListener('click', handleClick); root.removeEventListener('keydown', handleKeydown); };
}
