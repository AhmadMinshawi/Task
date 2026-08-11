export function openProjectForm(app, project = null) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading">
      <span class="eyebrow">${project ? 'Project settings' : 'New workspace'}</span>
      <h2>${project ? 'Edit project' : 'Add project'}</h2>
      <p>${project ? 'Update the project client, pricing, quantity and deadline.' : 'Set the project basics. Payments, deliveries and tasks can be added after creation.'}</p>
    </div>
    <form class="modal-form" data-project-form novalidate>
      <label>Project name<input name="name" type="text" maxlength="120" autocomplete="off" required></label>
      <label>Client<select name="clientId"><option value="">No client</option></select></label>
      <label>Status<select name="status"><option value="new">New</option><option value="in_progress">In progress</option><option value="ready">Ready to deliver</option><option value="completed">Completed</option></select></label>
      <div class="form-columns">
        <label>Price per video<input name="pricePerVideo" type="number" inputmode="decimal" min="0" step="0.01" value="0" required></label>
        <label>Total videos<input name="totalVideos" type="number" inputmode="numeric" min="0" step="1" value="0" required></label>
      </div>
      <label>Deadline <span class="optional">(optional)</span><input name="deadline" type="date"></label>
      ${project ? '<label>Project link <span class="optional">(optional)</span><input name="projectLink" type="url" inputmode="url" autocomplete="url" placeholder="https://…"></label>' : ''}
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action" type="submit">${project ? 'Save changes' : 'Create project'}</button></div>
    </form>`;

  const form = content.querySelector('[data-project-form]');
  const select = form.elements.clientId;
  for (const client of app.state.get().clients.filter(item => !item.deletedAt).sort((a, b) => a.name.localeCompare(b.name))) {
    select.add(new Option(client.name, client.id));
  }
  if (project) {
    form.elements.name.value = project.name || '';
    form.elements.clientId.value = project.clientId || '';
    form.elements.pricePerVideo.value = Number(project.pricePerVideo) || 0;
    form.elements.totalVideos.value = Number(project.totalVideos) || 0;
    form.elements.deadline.value = project.deadline ? String(project.deadline).slice(0, 10) : '';
    form.elements.projectLink.value = project.projectLink || '';
    form.elements.status.value = project.status || 'new';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const payload = { ...values, clientId: values.clientId || null, pricePerVideo: Number(values.pricePerVideo), totalVideos: Number(values.totalVideos) };
      const service = app.managers.get('ProjectService');
      project ? service.update(project.id, payload) : service.create(payload);
      app.modal.close();
    } catch (err) {
      error.textContent = err.message || 'Could not save project.';
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  form.elements.name.focus();
}
