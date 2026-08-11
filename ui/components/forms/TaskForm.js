export function openTaskForm(app, projects, task = null, { defaultProjectId = null, lockProject = false } = {}) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading"><span class="eyebrow">Execution</span><h2>${task ? 'Edit task' : 'Add task'}</h2><p>${task ? 'Update the task, project, income or status.' : 'Create a project task or a paid quick task.'}</p></div>
    <form class="modal-form" data-task-form novalidate>
      <label>Task title<input name="title" type="text" maxlength="160" autocomplete="off" required></label>
      <label>Project<select name="projectId"><option value="">Quick task / no project</option></select></label>
      <div class="form-columns"><label>Due date <span class="optional">(optional)</span><input name="dueDate" type="date"></label><label>Status<select name="status"><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label></div>
      <div class="form-columns"><label>Quick-task income<input name="amount" type="number" inputmode="decimal" min="0" step="0.01" value="0"></label><label>Income date <span class="optional">(optional)</span><input name="incomeDate" type="date"></label></div>
      <p class="field-hint">Quick-task income is added to the monthly total when the task is marked Done.</p><p class="form-error" aria-live="polite"></p>
      <div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action" type="submit">${task ? 'Save changes' : 'Create task'}</button></div>
    </form>`;
  const form = content.querySelector('[data-task-form]');
  for (const project of projects) form.elements.projectId.add(new Option(project.name, project.id));
  if (task) {
    form.elements.title.value = task.title || '';
    form.elements.projectId.value = task.projectId || '';
    form.elements.dueDate.value = task.dueDate ? String(task.dueDate).slice(0, 10) : '';
    form.elements.status.value = task.status || 'todo';
    form.elements.amount.value = Number(task.amount) || 0;
    form.elements.incomeDate.value = task.incomeDate ? String(task.incomeDate).slice(0, 10) : '';
  } else if (defaultProjectId) {
    form.elements.projectId.value = defaultProjectId;
  }
  if (lockProject) {
    form.elements.projectId.querySelector('option[value=""]')?.remove();
    form.elements.projectId.value = task?.projectId || defaultProjectId || '';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const service = app.managers.get('TaskService');
      task ? service.update(task.id, values) : service.create(values);
      app.modal.close();
    } catch (err) { error.textContent = err.message || 'Could not save task.'; }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  form.elements.title.focus();
}
