export function renderProjectTasksPanel(root, tasks) {
  root.innerHTML = `
    <section class="dashboard-card project-records-card">
      <div class="dashboard-card-head"><div><span class="eyebrow">Execution</span><h2>Project tasks</h2></div><button class="primary-action" type="button" data-add-project-task>Add task</button></div>
      <div class="project-record-list" data-project-task-list></div>
    </section>
  `;
  const list = root.querySelector('[data-project-task-list]');
  if (!tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = 'No active tasks for this project.';
    list.append(empty);
    return;
  }
  for (const task of tasks) {
    const row = document.createElement('article');
    row.className = 'project-task-row';
    row.dataset.projectTaskId = task.id;
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = task.title;
    const meta = document.createElement('small');
    meta.textContent = task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date';
    copy.append(title, meta);
    const status = document.createElement('span');
    status.className = 'task-status';
    status.textContent = task.status.replace('_', ' ');
    const actions = document.createElement('div');
    actions.className = 'row-menu-actions';
    actions.innerHTML = `<button class="row-action" type="button" data-toggle-project-task>${task.status === 'done' ? 'Reopen' : 'Done'}</button><button class="row-action" type="button" data-edit-project-task>Edit</button><button class="row-action" type="button" data-archive-project-task>Archive</button><button class="row-action danger-action" type="button" data-delete-project-task>Delete</button>`;
    row.append(copy, status, actions);
    list.append(row);
  }
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No date' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
