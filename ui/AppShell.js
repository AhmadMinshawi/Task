import { createUIManager } from './managers/UIManager.js';
import { renderHomeDashboard } from './components/HomeDashboard.js';
import { renderProjectsView } from './components/ProjectsView.js';
import { renderProjectWorkspace } from './components/ProjectWorkspace.js';
import { renderClientsView } from './components/ClientsView.js';
import { renderTasksView } from './components/TasksView.js';
import { renderSearchResults } from './components/SearchResults.js';
import { createModalController } from './components/Modal.js';
import { renderFinanceView } from './components/FinanceView.js';
import { renderCalendarView } from './components/CalendarView.js';
import { renderSettingsView } from './components/SettingsView.js';

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
        <button data-view="home"><span class="nav-icon">⌂</span><span class="nav-label">Home</span></button>
        <button data-view="projects"><span class="nav-icon">▣</span><span class="nav-label">Projects</span></button>
        <button data-view="clients"><span class="nav-icon">♙</span><span class="nav-label">Clients</span></button>
        <button data-view="tasks"><span class="nav-icon">✓</span><span class="nav-label">Tasks</span></button>
        <button data-view="finance"><span class="nav-icon">$</span><span class="nav-label">Finance</span></button>
        <button data-view="calendar"><span class="nav-icon">□</span><span class="nav-label">Calendar</span></button>
        <button data-view="settings"><span class="nav-icon">⚙</span><span class="nav-label">Settings</span></button>
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

  let activeRoute = 'home';
  let workspaceReturnRoute = 'projects';

  const routes = {
    home: () => navigateTo('home', 'HomeView', renderHomeDashboard),
    projects: () => navigateTo('projects', 'ProjectsView', renderProjectsView),
    clients: () => navigateTo('clients', 'ClientsView', renderClientsView),
    tasks: () => navigateTo('tasks', 'TasksView', renderTasksView),
    finance: () => navigateTo('finance', 'FinanceView', renderFinanceView),
    calendar: () => navigateTo('calendar', 'CalendarView', renderCalendarView),
    settings: () => navigateTo('settings', 'SettingsView', renderSettingsView)
  };

  function navigateTo(route, name, render) {
    activeRoute = route;
    mount(name, render);
  }

  function openProject(projectId) {
    workspaceReturnRoute = activeRoute === 'project' ? workspaceReturnRoute : activeRoute;
    activeRoute = 'project';
    mount('ProjectWorkspace', (r, a) => renderProjectWorkspace(r, a, projectId));
  }

  for (const [name, handler] of Object.entries(routes)) {
    root.querySelector(`[data-view="${name}"]`).addEventListener('click', handler);
  }

  view.addEventListener('click', event => {
    if (event.target.closest('[data-back]')) {
      (routes[workspaceReturnRoute] || routes.projects)();
      return;
    }
    if (event.target.closest('button, input, select, textarea, a')) return;
    const button = event.target.closest('.open-project, .project-card, [data-open-project]');
    if (!button) return;
    const id = button.dataset.projectId || button.closest('[data-project-id]')?.dataset.projectId;
    if (id) openProject(id);
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
        openProject(result.item.id);
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
