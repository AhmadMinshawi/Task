export function renderSettingsView(root, app) {
  root.innerHTML = `
    <div class="page-heading"><div><span class="eyebrow">Workspace</span><h1>Settings</h1></div></div>
    <div class="settings-stack">
      <section class="dashboard-card"><div class="dashboard-card-head"><div><span class="eyebrow">Archive</span><h2>Archived items</h2></div></div><div class="settings-groups" data-archives></div></section>
      <section class="dashboard-card trash-group" data-trash-group aria-expanded="false"><div class="dashboard-card-head trash-heading" data-toggle-trash role="button" tabindex="0"><div class="trash-title"><span class="trash-icon">♲</span><div><span class="eyebrow">Project basket</span><h2>Deleted projects</h2></div></div><div class="trash-heading-meta"><span class="dashboard-count" data-trash-count></span><span class="group-chevron">⌄</span></div></div><div data-trash-content hidden><p class="settings-note">Open any project to review its details, or restore it. Permanent deletion cannot be undone.</p><div class="settings-list trash-list" data-trash></div><div class="trash-footer"><button class="secondary-action danger-action" type="button" data-empty-trash>Delete all permanently</button></div></div></section>
      <section class="dashboard-card settings-placeholder"><span class="eyebrow">More settings</span><h2>Workspace options</h2><p>New account, appearance and workflow options can be added here next.</p></section>
    </div>
  `;

  const render = () => {
    renderArchives(root.querySelector('[data-archives]'), app.state.get());
    const state = app.state.get();
    renderTrash(root.querySelector('[data-trash]'), state);
    const deletedCount = state.projects.filter(project => project.deletedAt).length;
    root.querySelector('[data-trash-count]').textContent = `${deletedCount} deleted`;
    root.querySelector('[data-empty-trash]').hidden = deletedCount === 0;
  };

  const handleClick = event => {
    const action = event.target.closest('[data-settings-action]');
    if (action) {
      applyAction(app, action.dataset.settingsAction, action.dataset.type, action.dataset.id);
      return;
    }
    const row = event.target.closest('[data-archive-item]');
    if (row) {
      showArchivedItem(app, row.dataset.type, row.dataset.id);
      return;
    }
    const deletedProject = event.target.closest('[data-deleted-project]');
    if (deletedProject) {
      showDeletedProject(app, deletedProject.dataset.id);
      return;
    }
    const group = event.target.closest('[data-toggle-archive-group]')?.closest('[data-archive-group]');
    if (group) {
      const isOpen = group.getAttribute('aria-expanded') === 'true';
      group.setAttribute('aria-expanded', String(!isOpen));
      group.querySelector('[data-group-items]').hidden = isOpen;
      return;
    }
    const trashGroup = event.target.closest('[data-toggle-trash]')?.closest('[data-trash-group]');
    if (trashGroup) {
      const isOpen = trashGroup.getAttribute('aria-expanded') === 'true';
      trashGroup.setAttribute('aria-expanded', String(!isOpen));
      trashGroup.querySelector('[data-trash-content]').hidden = isOpen;
      return;
    }
    if (event.target.closest('[data-empty-trash]')) confirmEmptyTrash(app);
  };
  root.addEventListener('click', handleClick);
  render();
  const unsubscribe = app.state.subscribe(render);
  return () => { unsubscribe(); root.removeEventListener('click', handleClick); };
}

function renderArchives(container, state) {
  const groups = [
    ['Clients', 'client', state.clients.filter(x => !x.deletedAt && x.archivedAt)],
    ['Projects', 'project', state.projects.filter(x => !x.deletedAt && x.archivedAt)],
    ['Tasks', 'task', state.tasks.filter(x => !x.deletedAt && x.archivedAt)],
    ['Payments', 'payment', state.payments.filter(x => !x.deletedAt && x.archivedAt)],
    ['Deliveries', 'delivery', state.deliveries.filter(x => !x.deletedAt && x.archivedAt)],
    ['Expenses', 'expense', state.expenses.filter(x => !x.deletedAt && x.archivedAt)]
  ];
  container.replaceChildren();
  for (const [label, type, items] of groups) {
    const section = document.createElement('div');
    section.className = 'settings-group';
    section.dataset.archiveGroup = type;
    section.setAttribute('aria-expanded', 'false');
    const heading = document.createElement('div');
    heading.className = 'settings-group-title';
    heading.dataset.toggleArchiveGroup = '';
    heading.innerHTML = `<strong>${label}</strong><span>${items.length}</span>`;
    heading.setAttribute('role', 'button');
    heading.setAttribute('tabindex', '0');
    const itemsContainer = document.createElement('div');
    itemsContainer.dataset.groupItems = '';
    itemsContainer.hidden = true;
    section.append(heading, itemsContainer);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'settings-empty';
      empty.textContent = `No archived ${label.toLowerCase()}.`;
      itemsContainer.append(empty);
    } else {
      for (const item of items) itemsContainer.append(settingsRow(type, item, displayName(type, item), true));
    }
    container.append(section);
  }
}

function renderTrash(container, state) {
  const projects = state.projects.filter(project => project.deletedAt);
  container.replaceChildren();
  if (!projects.length) {
    const empty = document.createElement('p');
    empty.className = 'settings-empty';
    empty.textContent = 'The project basket is empty.';
    container.append(empty);
    return;
  }
  for (const project of projects) container.append(settingsRow('trash-project', project, project.name, false));
}

function settingsRow(type, item, name, archived) {
  const row = document.createElement('article');
  row.className = 'settings-row';
  if (archived) {
    row.dataset.archiveItem = '';
    row.dataset.type = type;
    row.dataset.id = item.id;
  }
  if (type === 'trash-project') {
    row.classList.add('trash-row');
    row.dataset.deletedProject = '';
    row.dataset.id = item.id;
  }
  const copy = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = name;
  const meta = document.createElement('small');
  meta.textContent = archived ? `Archived ${formatDate(item.archivedAt)}` : `Deleted ${formatDate(item.deletedAt)}`;
  copy.append(title, meta);
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const restore = document.createElement('button');
  restore.className = 'row-action';
  restore.type = 'button';
  restore.dataset.settingsAction = 'restore';
  restore.dataset.type = type;
  restore.dataset.id = item.id;
  restore.textContent = type === 'trash-project' ? 'Restore project' : 'Restore';
  actions.append(restore);
  if (archived || type === 'trash-project') {
    const remove = document.createElement('button');
    remove.className = 'row-action danger-action';
    remove.type = 'button';
    remove.dataset.settingsAction = type === 'trash-project' ? 'purge' : 'delete';
    remove.dataset.type = type;
    remove.dataset.id = item.id;
    remove.textContent = type === 'trash-project' ? 'Delete forever' : 'Delete';
    actions.append(remove);
  }
  row.append(copy, actions);
  return row;
}

function showDeletedProject(app, id) {
  const project = app.state.get().projects.find(item => item.id === id && item.deletedAt);
  if (!project) return;
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Deleted project</span><h2 data-name></h2><p>Review the project before choosing whether to restore or permanently delete it.</p></div><div class="archive-details"><p><span>Price per video</span><strong data-price></strong></p><p><span>Total videos</span><strong data-videos></strong></p><p><span>Deadline</span><strong data-deadline></strong></p><p><span>Deleted</span><strong data-deleted></strong></p></div><div class="modal-actions"><button class="secondary-action" type="button" data-close>Close</button><button class="primary-action" type="button" data-restore>Restore project</button></div>`;
  content.querySelector('[data-name]').textContent = project.name;
  content.querySelector('[data-price]').textContent = Number(project.pricePerVideo || 0).toLocaleString();
  content.querySelector('[data-videos]').textContent = String(Number(project.totalVideos) || 0);
  content.querySelector('[data-deadline]').textContent = project.deadline ? formatDate(project.deadline) : 'No deadline';
  content.querySelector('[data-deleted]').textContent = formatDate(project.deletedAt);
  content.querySelector('[data-close]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-restore]').addEventListener('click', () => { app.managers.get('ProjectService').restoreDeleted(id); app.modal.close(); });
  app.modal.open(content);
}

function showArchivedItem(app, type, id) {
  const collections = { client: 'clients', project: 'projects', task: 'tasks', payment: 'payments', delivery: 'deliveries', expense: 'expenses' };
  const item = app.state.get()[collections[type]]?.find(entry => entry.id === id);
  if (!item) return;
  const content = document.createElement('div');
  const details = [
    ['Name', displayName(type, item)],
    ['Status', 'Archived'],
    ['Archived', formatDate(item.archivedAt)]
  ];
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">${type}</span><h2 data-title></h2></div><div class="archive-details" data-details></div><div class="modal-actions"><button class="primary-action" type="button" data-close>Close</button></div>`;
  content.querySelector('[data-title]').textContent = displayName(type, item);
  const list = content.querySelector('[data-details]');
  for (const [label, value] of details) {
    const row = document.createElement('p');
    row.innerHTML = `<span></span><strong></strong>`;
    row.querySelector('span').textContent = label;
    row.querySelector('strong').textContent = value;
    list.append(row);
  }
  content.querySelector('[data-close]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
}

function applyAction(app, action, type, id) {
  if (type === 'trash-project') {
    const projects = app.managers.get('ProjectService');
    return action === 'restore' ? projects.restoreDeleted(id) : confirmPurgeProject(app, id);
  }
  const services = {
    client: app.managers.get('ClientService'),
    project: app.managers.get('ProjectService'),
    task: app.managers.get('TaskService'),
    expense: app.managers.get('ExpenseService')
  };
  if (type === 'payment' || type === 'delivery') {
    const finance = app.managers.get('FinanceService');
    return action === 'restore' ? finance.restore(type, id) : finance.remove(type, id);
  }
  return action === 'restore' ? services[type].restore(id) : services[type].remove(id);
}

function confirmPurgeProject(app, id) {
  const project = app.state.get().projects.find(item => item.id === id && item.deletedAt);
  if (!project) return;
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Permanent delete</span><h2>Delete this project forever?</h2><p><strong data-name></strong> will be removed permanently. This cannot be undone.</p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm>Delete permanently</button></div>`;
  content.querySelector('[data-name]').textContent = project.name;
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { app.managers.get('ProjectService').purgeDeleted(id); app.modal.close(); });
  app.modal.open(content);
}

function confirmEmptyTrash(app) {
  const deleted = app.state.get().projects.filter(project => project.deletedAt).length;
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Empty basket</span><h2>Delete all projects permanently?</h2><p>This permanently removes <strong data-count></strong> deleted project(s). This action cannot be undone.</p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm>Empty basket</button></div>`;
  content.querySelector('[data-count]').textContent = String(deleted);
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { app.managers.get('ProjectService').emptyTrash(); app.modal.close(); });
  app.modal.open(content);
}

function displayName(type, item) {
  if (type === 'client' || type === 'project') return item.name;
  if (type === 'task') return item.title;
  if (type === 'delivery') return `${item.title || 'Delivery'} · ${item.quantity || 0} videos`;
  return `${item.title || type} · ${Number(item.amount || 0).toLocaleString()}`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
