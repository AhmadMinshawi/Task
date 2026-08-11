import { openTaskForm } from './forms/TaskForm.js';

export function renderTasksView(root, app) {
  let mode = 'active';
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
      row.querySelector('small').textContent = project?.name || `Quick task${Number(task.amount) ? ` · ${Number(task.amount).toLocaleString()}` : ''}`;
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
      openTaskForm(app, projects);
      return;
    }
    const action = event.target.closest('[data-toggle-task],[data-edit-task],[data-archive-task],[data-restore-task],[data-delete-task]');
    const row = (action || event.target).closest('[data-task-id]');
    const task = app.state.get().tasks.find(x => x.id === row?.dataset.taskId && !x.deletedAt);
    if (!task) return;
    const service = app.managers.get('TaskService');
    if (!action) openTaskForm(app, app.state.get().projects.filter(project => !project.deletedAt && !project.archivedAt), task);
    else if (action.matches('[data-toggle-task]')) service.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
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
