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

    for (const project of state.projects.filter(p => !p.deletedAt)) {
      const payments = state.payments.filter(x => x.projectId === project.id && !x.deletedAt);
      const deliveries = state.deliveries.filter(x => x.projectId === project.id && !x.deletedAt);
      container.append(createProjectCard(project, finance.project(project, payments, deliveries)));
    }
  };

  render();
  const unsubscribe = app.state.subscribe(render);

  root.querySelector('[data-add-project]').addEventListener('click', () => {
    const name = window.prompt('Project name');
    if (!name?.trim()) return;
    app.managers.get('ProjectService').create({
      name,
      pricePerVideo: Number(window.prompt('Price per video', '0') || 0),
      totalVideos: Number(window.prompt('Total videos', '0') || 0)
    });
  });

  return () => unsubscribe();
}
