export function openClientForm(app, client = null) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading"><span class="eyebrow">People</span><h2>${client ? 'Edit client' : 'Add client'}</h2><p>${client ? 'Update the client profile and contact details.' : 'Create the client here, then connect projects to their account.'}</p></div>
    <form class="modal-form" data-client-form novalidate>
      <label>Client name<input name="name" type="text" maxlength="120" autocomplete="off" required></label>
      <label>Email <span class="optional">(optional)</span><input name="email" type="email" maxlength="160" autocomplete="off"></label>
      <label>Phone <span class="optional">(optional)</span><input name="phone" type="tel" maxlength="40" autocomplete="off"></label>
      <label>Industry / field <span class="optional">(optional)</span><input name="industry" type="text" maxlength="100" autocomplete="off" placeholder="Real estate, media, education…"></label>
      ${client ? '<label>Profile link <span class="optional">(optional)</span><input name="profileLink" type="url" inputmode="url" autocomplete="url" placeholder="https://…"></label>' : ''}
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action" type="submit">${client ? 'Save changes' : 'Create client'}</button></div>
    </form>`;
  const form = content.querySelector('[data-client-form]');
  if (client) for (const field of ['name', 'email', 'phone', 'industry', 'profileLink']) form.elements[field].value = client[field] || '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const service = app.managers.get('ClientService');
      client ? service.update(client.id, data) : service.create(data);
      app.modal.close();
    } catch (err) { error.textContent = err.message || 'Could not save client.'; }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  form.elements.name.focus();
}
