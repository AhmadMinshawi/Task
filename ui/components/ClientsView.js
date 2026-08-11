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
        <span class="eyebrow">Client</span>
        <h3></h3>
        <p></p>
        <small></small>
      `;
      card.querySelector('h3').textContent = client.name;
      card.querySelector('p').textContent = client.email || 'No email';
      card.querySelector('small').textContent = client.phone || 'No phone';
      container.append(card);
    }
  };

  const handleClick = event => {
    if (event.target.closest('[data-add-client]')) openClientForm(app);
  };
  root.addEventListener('click', handleClick);

  render();
  const unsubscribe = app.state.subscribe(render);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
  };
}

function openClientForm(app) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading">
      <span class="eyebrow">People</span>
      <h2>Add client</h2>
      <p>Create the client here, then connect projects to their account.</p>
    </div>
    <form class="modal-form" data-client-form novalidate>
      <label>Client name<input name="name" type="text" maxlength="120" autocomplete="off" required></label>
      <label>Email <span class="optional">(optional)</span><input name="email" type="email" maxlength="160" autocomplete="off"></label>
      <label>Phone <span class="optional">(optional)</span><input name="phone" type="tel" maxlength="40" autocomplete="off"></label>
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions">
        <button class="secondary-action" type="button" data-cancel>Cancel</button>
        <button class="primary-action" type="submit">Create client</button>
      </div>
    </form>
  `;
  const form = content.querySelector('[data-client-form]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      app.managers.get('ClientService').create(Object.fromEntries(new FormData(form).entries()));
      app.modal.close();
    } catch (err) {
      error.textContent = err.message || 'Could not create client.';
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  content.querySelector('[name="name"]').focus();
}
