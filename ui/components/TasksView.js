export function renderTasksView(root, app) {
  let mode = 'active';
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Execution</span><h1>Tasks</h1></div>
      <div class="page-actions"><button class="secondary-action is-active" type="button" data-task-mode="active">Active</button><button class="secondary-action" type="button" data-task-mode="archive">Archive</button><button class="primary-action" type="button" data-add-task>Add task</button></div>
    </div>
    <div class="tasks-list" data-tasks></div>
  `;

  const render = () => {
    const state = app.state.get();
    const container = root.querySelector('[data-tasks]');
    if (!container) return;
    container.replaceChildren();

    for (const task of state.tasks.filter(task => !task.deletedAt && (mode === 'archive' ? task.archivedAt : !task.archivedAt))) {
      const project = state.projects.find(p => p.id === task.projectId && !p.deletedAt);
      const row = document.createElement('article');
      row.className = 'task-row';
      row.dataset.taskId = task.id;
      row.innerHTML = `
        <div><strong></strong><small></small></div>
        <div class="task-row-actions">
          ${mode === 'active' ? `<button type="button" class="row-action" data-toggle-task>${task.status === 'done' ? 'Reopen' : 'Done'}</button><button type="button" class="row-action" data-edit-task>Edit</button><button type="button" class="row-action" data-archive-task>Archive</button>` : '<button type="button" class="row-action" data-restore-task>Restore</button>'}
          <button type="button" class="row-action danger-action" data-delete-task>Delete</button>
        </div>
        <span class="task-status"></span>
      `;
      row.querySelector('strong').textContent = task.title;
      row.querySelector('small').textContent = project?.name || 'Unknown project';
      row.querySelector('.task-status').textContent = task.status;
      container.append(row);
    }
  };

  const handleClick = event => {
    const modeButton = event.target.closest('[data-task-mode]');
    if (modeButton) {
      mode = modeButton.dataset.taskMode;
      root.querySelectorAll('[data-task-mode]').forEach(button => button.classList.toggle('is-active', button === modeButton));
      root.querySelector('[data-add-task]').hidden = mode === 'archive';
      render();
      return;
    }
    if (event.target.closest('[data-add-task]')) {
      const projects = app.state.get().projects.filter(project => !project.deletedAt && !project.archivedAt);
      if (!projects.length) return openNoProjectsMessage(app);
      openTaskForm(app, projects);
      return;
    }
    const action = event.target.closest('[data-toggle-task],[data-edit-task],[data-archive-task],[data-restore-task],[data-delete-task]');
    if (!action) return;
    const row = action.closest('[data-task-id]');
    const task = app.state.get().tasks.find(x => x.id === row?.dataset.taskId && !x.deletedAt);
    if (!task) return;
    const service = app.managers.get('TaskService');
    if (action.matches('[data-toggle-task]')) service.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    else if (action.matches('[data-edit-task]')) openTaskForm(app, app.state.get().projects.filter(project => !project.deletedAt && !project.archivedAt), task);
    else if (action.matches('[data-archive-task]')) service.archive(task.id);
    else if (action.matches('[data-restore-task]')) service.restore(task.id);
    else confirmTaskDelete(app, task, () => service.remove(task.id));
  };
  root.addEventListener('click', handleClick);

  render();
  const unsubscribe = app.state.subscribe(render);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
  };
}

function openTaskForm(app, projects, task = null) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading">
      <span class="eyebrow">Execution</span>
      <h2>${task ? 'Edit task' : 'Add task'}</h2>
      <p>${task ? 'Update the task, move it to another project or reopen completed work.' : 'Connect the task to a project and set its due date and current status.'}</p>
    </div>
    <form class="modal-form" data-task-form novalidate>
      <label>Task title<input name="title" type="text" maxlength="160" autocomplete="off" required></label>
      <label>Project<select name="projectId" required></select></label>
      <div class="form-columns">
        <label>Due date <span class="optional">(optional)</span><input name="dueDate" type="date"></label>
        <label>Status<select name="status"><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label>
      </div>
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions">
        <button class="secondary-action" type="button" data-cancel>Cancel</button>
        <button class="primary-action" type="submit">${task ? 'Save changes' : 'Create task'}</button>
      </div>
    </form>
  `;
  const select = content.querySelector('[name="projectId"]');
  for (const project of projects) {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    select.append(option);
  }
  const form = content.querySelector('[data-task-form]');
  if (task) {
    form.elements.title.value = task.title || '';
    form.elements.projectId.value = task.projectId || '';
    form.elements.dueDate.value = task.dueDate ? String(task.dueDate).slice(0, 10) : '';
    form.elements.status.value = task.status || 'todo';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      if (task) app.managers.get('TaskService').update(task.id, data);
      else app.managers.get('TaskService').create(data);
      app.modal.close();
    } catch (err) {
      error.textContent = err.message || 'Could not create task.';
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  content.querySelector('[name="title"]').focus();
}

function confirmTaskDelete(app, task, onConfirm) {
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Delete task</span><h2>Delete this task?</h2><p><strong data-name></strong> will be removed from active tasks and the archive.</p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm>Delete</button></div>`;
  content.querySelector('[data-name]').textContent = task.title;
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { onConfirm(); app.modal.close(); });
  app.modal.open(content);
}

function openNoProjectsMessage(app) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading"><span class="eyebrow">Project required</span><h2>Create a project first</h2><p>Every task must belong to a project. Open Projects and add one, then return here.</p></div>
    <div class="modal-actions"><button class="primary-action" type="button" data-ok>Got it</button></div>
  `;
  content.querySelector('[data-ok]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
}
