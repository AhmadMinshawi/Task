export function openProjectForm(app, project = null) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading">
      <span class="eyebrow">${project ? 'Project settings' : 'New project'}</span>
      <h2>${project ? 'Edit project' : 'Add project'}</h2>
      <p>Quick and large projects both keep full pricing, payment and delivery details.</p>
    </div>
    <form class="modal-form" data-project-form novalidate>
      <label>Project type<select name="projectType"><option value="quick">Quick project</option><option value="large">Large project</option></select></label>
      <p class="field-hint" data-type-help></p>
      <label>Project name<input name="name" type="text" maxlength="120" autocomplete="off" required></label>
      <label>Client<select name="clientId"><option value="">No client</option></select></label>
      <label>Status<select name="status"><option value="new">New</option><option value="in_progress">In progress</option><option value="ready">Ready to deliver</option><option value="completed">Completed</option></select></label>
      <div class="form-columns">
        <label>Price per video<input name="pricePerVideo" type="number" inputmode="decimal" min="0" step="0.01" value="0" required></label>
        <label>Total videos <span class="optional">(optional)</span><input name="totalVideos" type="number" inputmode="numeric" min="1" step="1" placeholder="Leave blank if unknown"></label>
      </div>
      <p class="field-hint">Leave the total empty for ongoing clients who pay a prepaid balance. TaskV will calculate how many funded videos remain.</p>
      <label>Deadline <span class="optional">(optional)</span><input name="deadline" type="date"></label>
      <label>Project link <span class="optional">(optional)</span><input name="projectLink" type="url" inputmode="url" autocomplete="url" placeholder="https://…"></label>
      <section class="project-notes-editor">
        <div class="project-notes-head"><div><strong>Project notes</strong><small>Date and reminder text only</small></div><button class="secondary-action" type="button" data-add-note>+ Add note</button></div>
        <div data-note-list></div>
      </section>
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action" type="submit">${project ? 'Save changes' : 'Create project'}</button></div>
    </form>`;

  const form = content.querySelector('[data-project-form]');
  const noteList = form.querySelector('[data-note-list]');
  for (const client of app.state.get().clients.filter(item => !item.deletedAt && (!item.archivedAt || item.id === project?.clientId)).sort((a, b) => a.name.localeCompare(b.name))) {
    form.elements.clientId.add(new Option(`${client.name}${client.archivedAt ? ' (archived)' : ''}`, client.id));
  }

  function addNote(note = {}) {
    const row = document.createElement('div');
    row.className = 'project-note-editor-row';
    row.dataset.noteId = note.id || crypto.randomUUID();
    row.innerHTML = '<input data-note-date type="date" required><input data-note-text type="text" maxlength="240" placeholder="What do you need to remember?" required><button class="row-action danger-action" type="button" data-remove-note>Delete</button>';
    row.querySelector('[data-note-date]').value = note.date ? String(note.date).slice(0, 10) : '';
    row.querySelector('[data-note-text]').value = note.text || '';
    noteList.append(row);
  }

  function updateTypeHelp() {
    form.querySelector('[data-type-help]').textContent = form.elements.projectType.value === 'quick'
      ? 'For short work such as one or two videos. Full finance and delivery tracking stays available.'
      : 'For longer work with the same full finance and delivery tracking.';
  }

  if (project) {
    form.elements.projectType.value = project.projectType === 'large' ? 'large' : 'quick';
    form.elements.name.value = project.name || '';
    form.elements.clientId.value = project.clientId || '';
    form.elements.pricePerVideo.value = Number(project.pricePerVideo) || 0;
    form.elements.totalVideos.value = Number(project.totalVideos) > 0 ? Number(project.totalVideos) : '';
    form.elements.deadline.value = project.deadline ? String(project.deadline).slice(0, 10) : '';
    form.elements.projectLink.value = project.projectLink || '';
    form.elements.status.value = project.status || 'new';
    for (const note of Array.isArray(project.notes) ? project.notes : []) addNote(note);
  }
  updateTypeHelp();

  form.elements.projectType.addEventListener('change', updateTypeHelp);
  content.querySelector('[data-add-note]').addEventListener('click', () => addNote());
  noteList.addEventListener('click', event => event.target.closest('[data-remove-note]')?.closest('.project-note-editor-row')?.remove());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const notes = [...noteList.querySelectorAll('.project-note-editor-row')].map(row => ({
        id: row.dataset.noteId,
        date: row.querySelector('[data-note-date]').value,
        text: row.querySelector('[data-note-text]').value
      }));
      const payload = { ...values, notes, clientId: values.clientId || null, pricePerVideo: Number(values.pricePerVideo), totalVideos: values.totalVideos ? Number(values.totalVideos) : 0 };
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
