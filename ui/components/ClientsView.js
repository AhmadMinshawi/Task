import { openClientForm } from './forms/ClientForm.js';
import { sortRecords } from '../utils/sortRecords.js';
import { activeRecords, isActiveRecord } from '../../core/recordState.js';

export function renderClientsView(root, app, options = {}) {
  const selectedClientId = typeof options === 'string' ? options : options.selectedClientId ?? null;
  const openSelectedClient = typeof options === 'object' && options.openSelectedClient === true;
  let sortMode = 'newest';
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">People</span><h1>Clients</h1></div>
      <div class="page-actions"><label class="sort-control">Sort<select data-client-sort><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option></select></label><button class="primary-action" type="button" data-add-client>Add client</button></div>
    </div>
    <div class="clients-grid" data-clients></div>
  `;

  const render = () => {
    const container = root.querySelector('[data-clients]');
    if (!container) return;
    container.replaceChildren();

    const clients = sortRecords(activeRecords(app.state.get().clients), sortMode);
    if (!clients.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>No clients yet</strong><p>Add your first client to connect projects and contact details.</p>';
      container.append(empty);
      return;
    }
    for (const client of clients) {
      const card = document.createElement('article');
      card.className = 'client-card';
      card.dataset.clientId = client.id;
      card.innerHTML = `
        <div class="client-card-head">
          <span class="eyebrow">Client</span>
          <div class="card-actions">
            <button class="client-edit" type="button" data-edit-client>Edit</button><button class="client-edit" type="button" data-archive-client>Archive</button>
            <button class="client-edit danger-action" type="button" data-delete-client>Delete</button>
          </div>
        </div>
        <h3 data-client-name></h3>
        <span class="client-industry" data-client-industry></span>
        <div class="client-contact">
          <p data-client-email></p>
          <small data-client-phone></small>
        </div>
        <div class="client-projects" data-client-projects></div>
        <a class="secondary-action detail-link" data-client-profile target="_blank" rel="noopener noreferrer" hidden>Open profile</a>
      `;
      card.querySelector('[data-client-name]').textContent = client.name;
      card.querySelector('[data-client-industry]').textContent = client.industry || 'No industry added';
      card.querySelector('[data-client-email]').textContent = client.email || 'No email';
      card.querySelector('[data-client-phone]').textContent = client.phone || 'No phone';
      const clientProjects = activeRecords(app.state.get().projects).filter(project => project.clientId === client.id);
      const projectsRoot = card.querySelector('[data-client-projects]');
      projectsRoot.innerHTML = clientProjects.length ? '<small>أعمال العميل</small>' : '<small>لا توجد مشروعات نشطة</small>';
      for (const project of clientProjects) {
        const projectButton = document.createElement('button');
        projectButton.type = 'button';
        projectButton.dataset.openProject = '';
        projectButton.dataset.projectId = project.id;
        projectButton.textContent = project.name || 'مشروع بدون اسم';
        projectsRoot.append(projectButton);
      }
      const profileLink = card.querySelector('[data-client-profile]');
      profileLink.hidden = !client.profileLink;
      if (client.profileLink) profileLink.href = client.profileLink;
      container.append(card);
    }
    const selected = selectedClientId && container.querySelector(`[data-client-id="${CSS.escape(selectedClientId)}"]`);
    if (selected) requestAnimationFrame(() => selected.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const handleClick = event => {
    if (event.target.closest('a')) return;
    if (event.target.closest('[data-open-project]')) return;
    if (event.target.closest('[data-add-client]')) {
      openClientForm(app);
      return;
    }
    const action = event.target.closest('[data-edit-client],[data-archive-client],[data-restore-client],[data-delete-client]');
    const card = (action || event.target).closest('[data-client-id]');
    const client = app.state.get().clients.find(x => x.id === card?.dataset.clientId && !x.deletedAt);
    if (!client) return;
    const service = app.managers.get('ClientService');
    if (!action || action.matches('[data-edit-client]')) openClientForm(app, client);
    else if (action.matches('[data-archive-client]')) service.archive(client.id);
    else if (action.matches('[data-restore-client]')) service.restore(client.id);
    else confirmDelete(app, client.name, () => service.remove(client.id));
  };
  const handleSort = event => {
    sortMode = event.target.value;
    render();
  };
  root.addEventListener('click', handleClick);
  root.querySelector('[data-client-sort]').addEventListener('change', handleSort);

  render();
  if (openSelectedClient && selectedClientId) {
    const selectedClient = app.state.get().clients.find(client => client.id === selectedClientId && isActiveRecord(client));
    if (selectedClient) openClientForm(app, selectedClient);
  }
  const unsubscribe = app.state.subscribe(render);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
    root.querySelector('[data-client-sort]')?.removeEventListener('change', handleSort);
  };
}

function confirmDelete(app, name, onConfirm) {
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Delete client</span><h2>Delete this client?</h2><p>This removes <strong data-name></strong> from active and archived clients. Their projects are not deleted.</p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm>Delete</button></div>`;
  content.querySelector('[data-name]').textContent = name;
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { onConfirm(); app.modal.close(); });
  app.modal.open(content);
}
