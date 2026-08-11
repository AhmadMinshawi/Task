import { createProjectCard } from './ProjectCard.js';

export function renderProjectsView(root, app) {
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Workspace</span><h1>Projects</h1></div>
      <button class="primary-action" type="button" data-add-project>Add project</button>
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
      .filter(project => !project.deletedAt)
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
    const pin = event.target.closest('[data-pin-project]');
    if (pin) {
      const project = app.state.get().projects.find(x => x.id === pin.dataset.pinProject && !x.deletedAt);
      if (project) app.managers.get('ProjectService').update(project.id, { pinned: !project.pinned });
      return;
    }

    if (event.target.closest('[data-add-project]')) openProjectForm(app);
  };
  root.addEventListener('click', handleClick);

  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
  };
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
