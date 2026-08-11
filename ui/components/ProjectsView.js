import { createProjectCard } from './ProjectCard.js';
import { openProjectForm } from './forms/ProjectForm.js';
import { sortRecords } from '../utils/sortRecords.js';

export function renderProjectsView(root, app) {
  let sortMode = 'newest';
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Workspace</span><h1>Projects</h1></div>
      <div class="page-actions"><label class="sort-control">Sort<select data-project-sort><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option></select></label><button class="primary-action" type="button" data-add-project>Add project</button></div>
    </div>
    <div class="projects-grid" data-projects></div>
  `;

  const render = () => {
    const state = app.state.get();
    const finance = app.managers.get('FinanceEngine');
    const container = root.querySelector('[data-projects]');
    if (!container) return;
    container.replaceChildren();

    const projects = sortRecords(
      state.projects.filter(project => !project.deletedAt && !project.archivedAt),
      sortMode,
      { pinned: true }
    );

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

    if (event.target.closest('[data-add-project]')) {
      openProjectForm(app);
      return;
    }
    const action = event.target.closest('[data-edit-project],[data-archive-project],[data-restore-project],[data-delete-project]');
    if (!action) return;
    const projectId = action.dataset.editProject || action.dataset.archiveProject || action.dataset.restoreProject || action.dataset.deleteProject;
    const project = app.state.get().projects.find(x => x.id === projectId && !x.deletedAt);
    if (!project) return;
    const service = app.managers.get('ProjectService');
    if (action.matches('[data-edit-project]')) openProjectForm(app, project);
    else if (action.matches('[data-archive-project]')) service.archive(project.id);
    else if (action.matches('[data-restore-project]')) service.restore(project.id);
    else confirmProjectDelete(app, project, () => service.remove(project.id));
  };
  const handleSort = event => {
    sortMode = event.target.value;
    render();
  };
  root.addEventListener('click', handleClick);
  root.querySelector('[data-project-sort]').addEventListener('change', handleSort);

  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
    root.querySelector('[data-project-sort]')?.removeEventListener('change', handleSort);
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
