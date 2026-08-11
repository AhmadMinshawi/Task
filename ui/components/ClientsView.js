export function renderClientsView(root, app) {
  let mode = 'active';
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">People</span><h1>Clients</h1></div>
      <button class="primary-action" type="button" data-add-client>Add client</button>
    </div>
    <div class="clients-grid" data-clients></div>
  `;

  const render = () => {
    const container = root.querySelector('[data-clients]');
    if (!container) return;
    container.replaceChildren();

    const clients = app.state.get().clients.filter(client => !client.deletedAt && (mode === 'archive' ? client.archivedAt : !client.archivedAt));
    for (const client of clients) {
      const card = document.createElement('article');
      card.className = 'client-card';
      card.dataset.clientId = client.id;
      card.innerHTML = `
        <div class="client-card-head">
          <span class="eyebrow">Client</span>
          <div class="card-actions">
            ${mode === 'active' ? '<button class="client-edit" type="button" data-edit-client>Edit</button><button class="client-edit" type="button" data-archive-client>Archive</button>' : '<button class="client-edit" type="button" data-restore-client>Restore</button>'}
            <button class="client-edit danger-action" type="button" data-delete-client>Delete</button>
          </div>
        </div>
        <h3 data-client-name></h3>
        <span class="client-industry" data-client-industry></span>
        <div class="client-contact">
          <p data-client-email></p>
          <small data-client-phone></small>
        </div>
      `;
      card.querySelector('[data-client-name]').textContent = client.name;
      card.querySelector('[data-client-industry]').textContent = client.industry || 'No industry added';
      card.querySelector('[data-client-email]').textContent = client.email || 'No email';
      card.querySelector('[data-client-phone]').textContent = client.phone || 'No phone';
      container.append(card);
    }
  };

  const handleClick = event => {
    const modeButton = event.target.closest('[data-client-mode]');
    if (modeButton) {
      mode = modeButton.dataset.clientMode;
      root.querySelectorAll('[data-client-mode]').forEach(button => button.classList.toggle('is-active', button === modeButton));
      root.querySelector('[data-add-client]').hidden = mode === 'archive';
      render();
      return;
    }
    if (event.target.closest('[data-add-client]')) {
      openClientForm(app);
      return;
    }
    const action = event.target.closest('[data-edit-client],[data-archive-client],[data-restore-client],[data-delete-client]');
    if (!action) return;
    const card = action.closest('[data-client-id]');
    const client = app.state.get().clients.find(x => x.id === card?.dataset.clientId && !x.deletedAt);
    if (!client) return;
    const service = app.managers.get('ClientService');
    if (action.matches('[data-edit-client]')) openClientForm(app, client);
    else if (action.matches('[data-archive-client]')) service.archive(client.id);
    else if (action.matches('[data-restore-client]')) service.restore(client.id);
    else confirmDelete(app, client.name, () => service.remove(client.id));
  };
  root.addEventListener('click', handleClick);

  render();
  const unsubscribe = app.state.subscribe(render);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
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

function openClientForm(app, client = null) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading">
      <span class="eyebrow">People</span>
      <h2>${client ? 'Edit client' : 'Add client'}</h2>
      <p>${client ? 'Update the client profile and keep their contact details current.' : 'Create the client here, then connect projects to their account.'}</p>
    </div>
    <form class="modal-form" data-client-form novalidate>
      <label>Client name<input name="name" type="text" maxlength="120" autocomplete="off" required></label>
      <label>Email <span class="optional">(optional)</span><input name="email" type="email" maxlength="160" autocomplete="off"></label>
      <label>Phone <span class="optional">(optional)</span><input name="phone" type="tel" maxlength="40" autocomplete="off"></label>
      <label>Industry / field <span class="optional">(optional)</span><input name="industry" type="text" maxlength="100" autocomplete="off" placeholder="Real estate, media, education…"></label>
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions">
        <button class="secondary-action" type="button" data-cancel>Cancel</button>
        <button class="primary-action" type="submit">${client ? 'Save changes' : 'Create client'}</button>
      </div>
    </form>
  `;
  const form = content.querySelector('[data-client-form]');
  if (client) {
    form.elements.name.value = client.name || '';
    form.elements.email.value = client.email || '';
    form.elements.phone.value = client.phone || '';
    form.elements.industry.value = client.industry || '';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      if (client) app.managers.get('ClientService').update(client.id, data);
      else app.managers.get('ClientService').create(data);
      app.modal.close();
    } catch (err) {
      error.textContent = err.message || 'Could not create client.';
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  content.querySelector('[name="name"]').focus();
}
