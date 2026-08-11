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

  root.querySelector('[data-add-client]').addEventListener('click', () => {
    const name = window.prompt('Client name');
    if (!name?.trim()) return;
    const email = window.prompt('Email', '') ?? '';
    const phone = window.prompt('Phone', '') ?? '';
    app.managers.get('ClientService').create({ name, email, phone });
  });

  render();
  return app.state.subscribe(render);
}
