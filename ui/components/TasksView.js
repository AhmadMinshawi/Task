export function renderTasksView(root, app) {
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Execution</span><h1>Tasks</h1></div>
      <button class="primary-action" type="button" data-add-task>Add task</button>
    </div>
    <div class="tasks-list" data-tasks></div>
  `;

  const render = () => {
    const state = app.state.get();
    const container = root.querySelector('[data-tasks]');
    if (!container) return;
    container.replaceChildren();

    for (const task of state.tasks.filter(t => !t.deletedAt)) {
      const project = state.projects.find(p => p.id === task.projectId && !p.deletedAt);
      const row = document.createElement('article');
      row.className = 'task-row';
      row.innerHTML = `
        <div><strong></strong><small></small></div>
        <span class="task-status"></span>
      `;
      row.querySelector('strong').textContent = task.title;
      row.querySelector('small').textContent = project?.name || 'Unknown project';
      row.querySelector('.task-status').textContent = task.status;
      container.append(row);
    }
  };

  const handleClick = event => {
    if (!event.target.closest('[data-add-task]')) return;
    const projects = app.state.get().projects.filter(project => !project.deletedAt);
    if (!projects.length) return openNoProjectsMessage(app);
    openTaskForm(app, projects);
  };
  root.addEventListener('click', handleClick);

  render();
  const unsubscribe = app.state.subscribe(render);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
  };
}

function openTaskForm(app, projects) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading">
      <span class="eyebrow">Execution</span>
      <h2>Add task</h2>
      <p>Connect the task to a project and set its due date and current status.</p>
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
        <button class="primary-action" type="submit">Create task</button>
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
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      app.managers.get('TaskService').create(Object.fromEntries(new FormData(form).entries()));
      app.modal.close();
    } catch (err) {
      error.textContent = err.message || 'Could not create task.';
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  content.querySelector('[name="title"]').focus();
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
