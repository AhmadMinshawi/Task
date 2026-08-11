export function renderSettingsView(root, app) {
  root.innerHTML = `
    <div class="page-heading"><div><span class="eyebrow">Workspace</span><h1>Settings</h1></div></div>
    <div class="settings-stack">
      <section class="dashboard-card"><div class="dashboard-card-head"><div><span class="eyebrow">Archive</span><h2>Archived items</h2></div></div><div class="settings-groups" data-archives></div></section>
      <section class="dashboard-card"><div class="dashboard-card-head"><div><span class="eyebrow">Project basket</span><h2>Deleted projects</h2></div><button class="secondary-action danger-action" type="button" data-empty-trash>Empty basket</button></div><p class="settings-note">Deleted projects stay here until you restore them or empty the basket.</p><div class="settings-list" data-trash></div></section>
      <section class="dashboard-card settings-placeholder"><span class="eyebrow">More settings</span><h2>Workspace options</h2><p>New account, appearance and workflow options can be added here next.</p></section>
    </div>
  `;

  const render = () => {
    renderArchives(root.querySelector('[data-archives]'), app.state.get());
    renderTrash(root.querySelector('[data-trash]'), app.state.get());
  };

  const handleClick = event => {
    const action = event.target.closest('[data-settings-action]');
    if (action) {
      applyAction(app, action.dataset.settingsAction, action.dataset.type, action.dataset.id);
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
    const heading = document.createElement('div');
    heading.className = 'settings-group-title';
    heading.innerHTML = `<strong>${label}</strong><span>${items.length}</span>`;
    section.append(heading);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'settings-empty';
      empty.textContent = `No archived ${label.toLowerCase()}.`;
      section.append(empty);
    } else {
      for (const item of items) section.append(settingsRow(type, item, displayName(type, item), true));
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
  restore.textContent = 'Restore';
  actions.append(restore);
  if (archived) {
    const remove = document.createElement('button');
    remove.className = 'row-action danger-action';
    remove.type = 'button';
    remove.dataset.settingsAction = 'delete';
    remove.dataset.type = type;
    remove.dataset.id = item.id;
    remove.textContent = 'Delete';
    actions.append(remove);
  }
  row.append(copy, actions);
  return row;
}

function applyAction(app, action, type, id) {
  if (type === 'trash-project') return app.managers.get('ProjectService').restoreDeleted(id);
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
