import { createProjectCard } from './ProjectCard.js';

export function renderProjectsView(root, app) {
  let mode = 'active';
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Workspace</span><h1>Projects</h1></div>
      <div class="page-actions"><button class="secondary-action is-active" type="button" data-project-mode="active">Active</button><button class="secondary-action" type="button" data-project-mode="archive">Archive</button><button class="primary-action" type="button" data-add-project>Add project</button></div>
    </div>
    <div class="projects-grid" data-projects></div>
  `;

  const render = () => {
    const state = app.state.get();
    const finance = app.managers.get('FinanceEngine');
    const container = root.querySelector('[data-projects]');
    if (!container) return;
    container.replaceChildren();

    const projects = state.projects
      .filter(project => !project.deletedAt && (mode === 'archive' ? project.archivedAt : !project.archivedAt))
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

    if (!projects.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>No projects yet</strong><p>Add your first project without leaving TaskV.</p>';
      container.append(empty);
      return;
    }

    for (const project of projects) {
      const payments = state.payments.filter(x => x.projectId === project.id && !x.deletedAt);
      const deliveries = state.deliveries.filter(x => x.projectId === project.id && !x.deletedAt);
      container.append(createProjectCard(project, finance.project(project, payments, deliveries)));
    }
  };

  render();
  const unsubscribe = app.state.subscribe(render);

  const handleClick = event => {
    const modeButton = event.target.closest('[data-project-mode]');
    if (modeButton) {
      mode = modeButton.dataset.projectMode;
      root.querySelectorAll('[data-project-mode]').forEach(button => button.classList.toggle('is-active', button === modeButton));
      root.querySelector('[data-add-project]').hidden = mode === 'archive';
      render();
      return;
    }
    const pin = event.target.closest('[data-pin-project]');
    if (pin) {
      const project = app.state.get().projects.find(x => x.id === pin.dataset.pinProject && !x.deletedAt);
      if (project) app.managers.get('ProjectService').update(project.id, { pinned: !project.pinned });
      return;
    }

    if (event.target.closest('[data-add-project]')) openProjectForm(app);
    const action = event.target.closest('[data-archive-project],[data-restore-project],[data-delete-project]');
    if (!action) return;
    const project = app.state.get().projects.find(x => x.id === (action.dataset.archiveProject || action.dataset.restoreProject || action.dataset.deleteProject) && !x.deletedAt);
    if (!project) return;
    const service = app.managers.get('ProjectService');
    if (action.matches('[data-archive-project]')) service.archive(project.id);
    else if (action.matches('[data-restore-project]')) service.restore(project.id);
    else confirmProjectDelete(app, project, () => service.remove(project.id));
  };
  root.addEventListener('click', handleClick);

  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
  };
}

function confirmProjectDelete(app, project, onConfirm) {
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Delete project</span><h2>Delete this project?</h2><p><strong data-name></strong> will be removed. Its finance records and tasks remain stored until you manage them separately.</p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm>Delete</button></div>`;
  content.querySelector('[data-name]').textContent = project.name;
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { onConfirm(); app.modal.close(); });
  app.modal.open(content);
}

function openProjectForm(app) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading">
      <span class="eyebrow">New workspace</span>
      <h2>Add project</h2>
      <p>Set the project basics. Payments, deliveries and tasks can be added after creation.</p>
    </div>
    <form class="modal-form" data-project-form novalidate>
      <label>Project name<input name="name" type="text" maxlength="120" autocomplete="off" required></label>
      <label>Client<select name="clientId"><option value="">No client</option></select></label>
      <div class="form-columns">
        <label>Price per video<input name="pricePerVideo" type="number" min="0" step="0.01" value="0" required></label>
        <label>Total videos<input name="totalVideos" type="number" min="0" step="1" value="0" required></label>
      </div>
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions">
        <button class="secondary-action" type="button" data-cancel>Cancel</button>
        <button class="primary-action" type="submit">Create project</button>
      </div>
    </form>
  `;

  const select = content.querySelector('select');
  for (const client of app.state.get().clients.filter(x => !x.deletedAt).sort((a, b) => a.name.localeCompare(b.name))) {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    select.append(option);
  }

  const form = content.querySelector('[data-project-form]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      app.managers.get('ProjectService').create({
        ...data,
        clientId: data.clientId || null,
        pricePerVideo: Number(data.pricePerVideo),
        totalVideos: Number(data.totalVideos)
      });
      app.modal.close();
    } catch (err) {
      error.textContent = err.message || 'Could not create project.';
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  content.querySelector('[name="name"]').focus();
}
