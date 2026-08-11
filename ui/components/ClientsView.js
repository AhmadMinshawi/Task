export function renderClientsView(root, app) {
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

    for (const client of app.state.get().clients.filter(c => !c.deletedAt)) {
      const card = document.createElement('article');
      card.className = 'client-card';
      card.dataset.clientId = client.id;
      card.innerHTML = `
        <div class="client-card-head">
          <span class="eyebrow">Client</span>
          <button class="client-edit" type="button" data-edit-client aria-label="Edit client">Edit</button>
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
    if (event.target.closest('[data-add-client]')) {
      openClientForm(app);
      return;
    }
    const edit = event.target.closest('[data-edit-client]');
    if (!edit) return;
    const card = edit.closest('[data-client-id]');
    const client = app.state.get().clients.find(x => x.id === card?.dataset.clientId && !x.deletedAt);
    if (client) openClientForm(app, client);
  };
  root.addEventListener('click', handleClick);

  render();
  const unsubscribe = app.state.subscribe(render);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
  };
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
