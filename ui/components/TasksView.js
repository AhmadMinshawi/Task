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

  root.querySelector('[data-add-task]').addEventListener('click', () => {
    const projects = app.state.get().projects.filter(p => !p.deletedAt);
    if (!projects.length) return window.alert('Create a project first.');
    const title = window.prompt('Task title');
    if (!title?.trim()) return;
    const projectId = projects[0].id;
    app.managers.get('TaskService').create({ title, projectId });
  });

  render();
  return app.state.subscribe(render);
}
