const COLLECTIONS = { client: 'clients', project: 'projects', task: 'tasks', payment: 'payments', delivery: 'deliveries', expense: 'expenses' };

export function renderArchivePanel(container, state) {
  const groups = [
    ['Clients', 'client'], ['Projects', 'project'], ['Tasks', 'task'],
    ['Payments', 'payment'], ['Deliveries', 'delivery'], ['Expenses', 'expense']
  ];
  container.replaceChildren(...groups.map(([label, type]) => archiveGroup(label, type, state[COLLECTIONS[type]].filter(item => !item.deletedAt && item.archivedAt))));
}

export function handleArchivePanelClick(event, app) {
  const action = event.target.closest('[data-archive-action]');
  if (action) {
    mutateArchive(app, action.dataset.archiveAction, action.dataset.type, action.dataset.id);
    return true;
  }
  const item = event.target.closest('[data-archive-item]');
  if (item) {
    showArchivedItem(app, item.dataset.type, item.dataset.id);
    return true;
  }
  const heading = event.target.closest('[data-toggle-archive-group]');
  if (!heading) return false;
  const group = heading.closest('[data-archive-group]');
  const isOpen = group.getAttribute('aria-expanded') === 'true';
  group.setAttribute('aria-expanded', String(!isOpen));
  group.querySelector('[data-group-items]').hidden = isOpen;
  return true;
}

function archiveGroup(label, type, items) {
  const group = document.createElement('section');
  group.className = 'settings-group';
  group.dataset.archiveGroup = type;
  group.setAttribute('aria-expanded', 'false');
  group.innerHTML = `<div class="settings-group-title" data-toggle-archive-group role="button" tabindex="0"><strong></strong><span></span></div><div data-group-items hidden></div>`;
  group.querySelector('strong').textContent = label;
  group.querySelector('.settings-group-title span').textContent = String(items.length);
  const list = group.querySelector('[data-group-items]');
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'settings-empty';
    empty.textContent = `No archived ${label.toLowerCase()}.`;
    list.append(empty);
  } else items.forEach(item => list.append(archiveRow(type, item)));
  return group;
}

function archiveRow(type, item) {
  const row = document.createElement('article');
  row.className = 'settings-row';
  row.dataset.archiveItem = '';
  row.dataset.type = type;
  row.dataset.id = item.id;
  row.innerHTML = `<div><strong></strong><small></small></div><div class="card-actions"><button class="row-action" type="button" data-archive-action="restore">Restore</button><button class="row-action danger-action" type="button" data-archive-action="delete">Delete</button></div>`;
  row.querySelector('strong').textContent = displayName(type, item);
  row.querySelector('small').textContent = `Archived ${formatDate(item.archivedAt)}`;
  row.querySelectorAll('[data-archive-action]').forEach(button => { button.dataset.type = type; button.dataset.id = item.id; });
  return row;
}

function mutateArchive(app, action, type, id) {
  if (type === 'payment' || type === 'delivery') {
    const finance = app.managers.get('FinanceService');
    return action === 'restore' ? finance.restore(type, id) : finance.remove(type, id);
  }
  const services = { client: 'ClientService', project: 'ProjectService', task: 'TaskService', expense: 'ExpenseService' };
  const service = app.managers.get(services[type]);
  return action === 'restore' ? service.restore(id) : service.remove(id);
}

function showArchivedItem(app, type, id) {
  const item = app.state.get()[COLLECTIONS[type]]?.find(entry => entry.id === id);
  if (!item) return;
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow"></span><h2></h2></div><div class="archive-details"><p><span>Status</span><strong>Archived</strong></p><p><span>Archived</span><strong data-date></strong></p></div><div class="modal-actions"><button class="primary-action" type="button" data-close>Close</button></div>`;
  content.querySelector('.eyebrow').textContent = type;
  content.querySelector('h2').textContent = displayName(type, item);
  content.querySelector('[data-date]').textContent = formatDate(item.archivedAt);
  content.querySelector('[data-close]').addEventListener('click', () => app.modal.close());
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
