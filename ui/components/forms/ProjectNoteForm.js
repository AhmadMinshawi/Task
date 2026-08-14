import { activeRecords } from '../../../core/recordState.js';
import { localDateKey } from '../../utils/formatters.js';

export function openProjectNoteForm(app, { projectId = null, note = null, lockProject = false } = {}) {
  const projects = activeRecords(app.state.get().projects);
  if (!projects.length) throw new Error('Create a project before adding a note');
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading"><span class="eyebrow">Quick reminder</span><h2>${note ? 'Edit note' : 'Add note'}</h2><p>Date and reminder text only.</p></div>
    <form class="modal-form quick-note-form" data-quick-note-form novalidate>
      <label>Project<select name="projectId" required></select></label>
      <label>Date<input name="date" type="date" required></label>
      <label>Note<input name="text" type="text" maxlength="240" autocomplete="off" placeholder="What do you need to remember?" required></label>
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action" type="submit">${note ? 'Save note' : 'Add note'}</button></div>
    </form>`;
  const form = content.querySelector('[data-quick-note-form]');
  for (const project of projects.sort((a, b) => a.name.localeCompare(b.name))) form.elements.projectId.add(new Option(project.name, project.id));
  form.elements.projectId.value = projectId || projects[0].id;
  form.elements.projectId.disabled = Boolean(lockProject || note);
  form.elements.date.value = note?.date ? String(note.date).slice(0, 10) : localDateKey(new Date());
  form.elements.text.value = note?.text || '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const selectedProjectId = form.elements.projectId.value;
      const input = { date: form.elements.date.value, text: form.elements.text.value };
      const service = app.managers.get('ProjectNoteService');
      note ? service.update(selectedProjectId, note.id, input) : service.create(selectedProjectId, input);
      app.modal.close();
    } catch (err) {
      error.textContent = err.message || 'Could not save note.';
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  form.elements.text.focus();
}
