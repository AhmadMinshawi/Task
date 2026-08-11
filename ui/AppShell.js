import { createUIManager } from './managers/UIManager.js';
import { renderHomeDashboard } from './components/HomeDashboard.js';
import { renderProjectsView } from './components/ProjectsView.js';
import { renderProjectWorkspace } from './components/ProjectWorkspace.js';
import { renderClientsView } from './components/ClientsView.js';
import { renderTasksView } from './components/TasksView.js';
import { renderSearchResults } from './components/SearchResults.js';
import { createModalController } from './components/Modal.js';

export function renderAppShell(root, app, config) {
  const ui = createUIManager(app);
  app.ui = ui;

  root.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">${config.logo.mark}</div>
        <div><strong>${config.name}</strong><small>${config.version}</small></div>
      </div>
      <nav>
        <button data-view="home">Home</button>
        <button data-view="projects">Projects</button>
        <button data-view="clients">Clients</button>
        <button data-view="tasks">Tasks</button>
        <button data-view="finance">Finance</button>
      </nav>
    </aside>
    <main class="main">
      <header class="topbar">
        <div><strong>Command Center</strong><small class="connection-status">Supabase · Secure</small></div>
        <div class="topbar-actions">
          <div class="search">
            <input id="global-search" autocomplete="off" placeholder="Search by first letter…">
            <div class="search-results" id="search-results" hidden></div>
          </div>
          <button class="signout-button" type="button" data-signout>Sign out</button>
        </div>
      </header>
      <section id="view" class="view"></section>
    </main>
    <div id="modal-root" hidden></div>
  `;

  const view = root.querySelector('#view');
  app.modal = createModalController(root.querySelector('#modal-root'));

  function mount(name, render) {
    ui.destroyAll();
    const cleanup = render(view, app);
    ui.register(name, { destroy: cleanup });
  }

  const routes = {
    home: () => mount('HomeView', renderHomeDashboard),
    projects: () => mount('ProjectsView', renderProjectsView),
    clients: () => mount('ClientsView', renderClientsView),
    tasks: () => mount('TasksView', renderTasksView),
    finance: () => mount('FinanceView', renderHomeDashboard)
  };

  for (const [name, handler] of Object.entries(routes)) {
    root.querySelector(`[data-view="${name}"]`).addEventListener('click', handler);
  }

  view.addEventListener('click', event => {
    if (event.target.closest('[data-back]')) {
      routes.projects();
      return;
    }
    const button = event.target.closest('.open-project');
    if (!button) return;
    const id = button.dataset.projectId || button.closest('.project-card')?.dataset.projectId;
    if (id) mount('ProjectWorkspace', (r, a) => renderProjectWorkspace(r, a, id));
  });


  root.querySelector('[data-signout]').addEventListener('click', async () => {
    await app.managers.get('AuthManager').signOut();
  });

  const searchInput = root.querySelector('#global-search');
  const searchResults = root.querySelector('#search-results');

  searchInput.addEventListener('input', event => {
    const results = app.managers.get('SearchManager').search(event.target.value);
    renderSearchResults(searchResults, results, result => {
      searchInput.value = result.item.name ?? result.item.title ?? '';
      searchResults.hidden = true;

      if (result.type === 'projects') {
        mount('ProjectWorkspace', (r, a) => renderProjectWorkspace(r, a, result.item.id));
      } else if (result.type === 'clients') {
        routes.clients();
      } else if (result.type === 'tasks') {
        routes.tasks();
      }
    });
    searchResults.hidden = !event.target.value.trim();
  });

  mount('HomeView', renderHomeDashboard);
}
