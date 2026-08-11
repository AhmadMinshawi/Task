export function renderTrashPanel(container, state) {
  const projects = state.projects.filter(project => project.deletedAt);
  container.querySelector('[data-trash-count]').textContent = `${projects.length} deleted`;
  container.querySelector('[data-empty-trash]').hidden = projects.length === 0;
  const list = container.querySelector('[data-trash-list]');
  list.replaceChildren();
  if (!projects.length) {
    const empty = document.createElement('p');
    empty.className = 'settings-empty';
    empty.textContent = 'The project basket is empty.';
    list.append(empty);
    return;
  }
  projects.forEach(project => list.append(trashRow(project)));
}

export function handleTrashPanelClick(event, app) {
  const action = event.target.closest('[data-trash-action]');
  if (action) {
    if (action.dataset.trashAction === 'restore') app.managers.get('ProjectService').restoreDeleted(action.dataset.id);
    else confirmPurge(app, action.dataset.id);
    return true;
  }
  if (event.target.closest('[data-empty-trash]')) { confirmEmpty(app); return true; }
  const project = event.target.closest('[data-deleted-project]');
  if (project) { showDeleted(app, project.dataset.id); return true; }
  const heading = event.target.closest('[data-toggle-trash]');
  if (!heading) return false;
  const group = heading.closest('[data-trash-group]');
  const isOpen = group.getAttribute('aria-expanded') === 'true';
  group.setAttribute('aria-expanded', String(!isOpen));
  group.querySelector('[data-trash-content]').hidden = isOpen;
  return true;
}

function trashRow(project) {
  const row = document.createElement('article');
  row.className = 'settings-row trash-row';
  row.dataset.deletedProject = '';
  row.dataset.id = project.id;
  row.innerHTML = `<div><strong></strong><small></small></div><div class="card-actions"><button class="row-action" type="button" data-trash-action="restore">Restore project</button><button class="row-action danger-action" type="button" data-trash-action="purge">Delete forever</button></div>`;
  row.querySelector('strong').textContent = project.name;
  row.querySelector('small').textContent = `Deleted ${formatDate(project.deletedAt)}`;
  row.querySelectorAll('[data-trash-action]').forEach(button => { button.dataset.id = project.id; });
  return row;
}

function showDeleted(app, id) {
  const project = app.state.get().projects.find(item => item.id === id && item.deletedAt);
  if (!project) return;
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Deleted project</span><h2 data-name></h2><p>Review the project before restoring or permanently deleting it.</p></div><div class="archive-details"><p><span>Price per video</span><strong data-price></strong></p><p><span>Total videos</span><strong data-videos></strong></p><p><span>Deadline</span><strong data-deadline></strong></p><p><span>Deleted</span><strong data-deleted></strong></p></div><div class="modal-actions"><button class="secondary-action" type="button" data-close>Close</button><button class="primary-action" type="button" data-restore>Restore project</button></div>`;
  content.querySelector('[data-name]').textContent = project.name;
  content.querySelector('[data-price]').textContent = Number(project.pricePerVideo || 0).toLocaleString();
  content.querySelector('[data-videos]').textContent = String(Number(project.totalVideos) || 0);
  content.querySelector('[data-deadline]').textContent = project.deadline ? formatDate(project.deadline) : 'No deadline';
  content.querySelector('[data-deleted]').textContent = formatDate(project.deletedAt);
  content.querySelector('[data-close]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-restore]').addEventListener('click', () => { app.managers.get('ProjectService').restoreDeleted(id); app.modal.close(); });
  app.modal.open(content);
}

function confirmPurge(app, id) {
  const project = app.state.get().projects.find(item => item.id === id && item.deletedAt);
  if (!project) return;
  confirm(app, 'Delete this project forever?', `${project.name} will be removed permanently. This cannot be undone.`, 'Delete permanently', () => app.managers.get('ProjectService').purgeDeleted(id));
}

function confirmEmpty(app) {
  const count = app.state.get().projects.filter(project => project.deletedAt).length;
  if (!count) return;
  confirm(app, 'Delete all projects permanently?', `This permanently removes ${count} deleted project(s).`, 'Delete all permanently', () => app.managers.get('ProjectService').emptyTrash());
}

function confirm(app, title, message, buttonText, onConfirm) {
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Permanent delete</span><h2></h2><p></p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm></button></div>`;
  content.querySelector('h2').textContent = title;
  content.querySelector('p').textContent = message;
  content.querySelector('[data-confirm]').textContent = buttonText;
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { onConfirm(); app.modal.close(); });
  app.modal.open(content);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
