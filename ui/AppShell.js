import { createUIManager } from './managers/UIManager.js';
import { renderHomeDashboard } from './components/HomeDashboard.js';
import { renderProjectsView } from './components/ProjectsView.js';
import { renderProjectWorkspace } from './components/ProjectWorkspace.js';
import { renderClientsView } from './components/ClientsView.js';
import { createModalController } from './components/Modal.js';
import { renderFinanceView } from './components/FinanceView.js';
import { renderCalendarView } from './components/CalendarView.js';
import { renderSettingsView } from './components/SettingsView.js';
import { mountNotificationCenter } from './components/NotificationCenter.js';
import { renderProfileView } from './components/ProfileView.js';
import { mountAccountMenu } from './components/AccountMenu.js';
import { mountGlobalSearch } from './components/GlobalSearch.js';
import { mountPersistenceStatus } from './components/PersistenceStatus.js';

export function renderAppShell(root, app, config) {
  app.shellCleanup?.();
  const ui = createUIManager(app);
  app.ui = ui;

  root.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">${config.logo.mark}</div>
        <div class="brand-copy"><strong>${config.name}</strong><small>${config.version}</small></div>
        <div class="notification-center" data-notification-center></div>
      </div>
      <nav>
        <button data-view="projects" aria-label="Projects" title="Projects"><span class="nav-icon">▣</span><span class="nav-label">Projects</span></button>
        <button data-view="clients" aria-label="Clients" title="Clients"><span class="nav-icon">♙</span><span class="nav-label">Clients</span></button>
        <button data-view="finance" aria-label="Finance" title="Finance"><span class="nav-icon">$</span><span class="nav-label">Finance</span></button>
        <button data-view="calendar" aria-label="Calendar" title="Calendar"><span class="nav-icon">□</span><span class="nav-label">Calendar</span></button>
      </nav>
    </aside>
    <main class="main">
      <header class="topbar">
        <div><strong>Command Center</strong><button class="connection-status" type="button" data-persistence-status hidden></button></div>
        <div class="topbar-actions">
          <div class="search">
            <input id="global-search" autocomplete="off" placeholder="ابحث بالاسم أو البريد أو الموبايل">
            <div class="search-results" id="search-results" hidden></div>
          </div>
          <button class="header-home" type="button" data-view="home" aria-label="Home"><span>⌂</span><strong>Home</strong></button>
          <div class="account-menu" data-account-menu></div>
        </div>
      </header>
      <section id="view" class="view"></section>
    </main>
    <div id="modal-root" hidden></div>
  `;

  const view = root.querySelector('#view');
  const authUser = app.managers.get('AuthManager').user();
  app.modal = createModalController(root.querySelector('#modal-root'));

  function mount(name, render) {
    ui.destroyAll();
    const cleanup = render(view, app);
    ui.register(name, { destroy: cleanup });
  }

  let activeRoute = 'home';
  let workspaceReturnRoute = 'projects';
  let selectedClientId = null;
  let openClientFromSearch = false;

  const routes = {
    home: () => navigateTo('home', 'HomeView', renderHomeDashboard),
    projects: () => navigateTo('projects', 'ProjectsView', renderProjectsView),
    clients: () => navigateTo('clients', 'ClientsView', (r, a) => {
      const options = { selectedClientId, openSelectedClient: openClientFromSearch };
      openClientFromSearch = false;
      return renderClientsView(r, a, options);
    }),
    finance: () => navigateTo('finance', 'FinanceView', renderFinanceView),
    calendar: () => navigateTo('calendar', 'CalendarView', renderCalendarView),
    settings: () => navigateTo('settings', 'SettingsView', renderSettingsView),
    profile: () => navigateTo('profile', 'ProfileView', renderProfileView)
  };

  function navigateTo(route, name, render) {
    activeRoute = route;
    setActiveNavigation(route);
    mount(name, render);
  }

  function setActiveNavigation(route) {
    const selected = route === 'project' ? 'projects' : route;
    root.querySelectorAll('[data-view]').forEach(button => {
      const active = button.dataset.view === selected;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    root.querySelector('[data-account-trigger]')?.classList.toggle('is-active', ['profile', 'settings'].includes(selected));
  }

  function openProject(projectId) {
    workspaceReturnRoute = activeRoute === 'project' ? workspaceReturnRoute : activeRoute;
    activeRoute = 'project';
    setActiveNavigation('project');
    mount('ProjectWorkspace', (r, a) => renderProjectWorkspace(r, a, projectId));
  }

  for (const [name, handler] of Object.entries(routes)) {
    root.querySelector(`[data-view="${name}"]`)?.addEventListener('click', handler);
  }

  view.addEventListener('click', event => {
    if (event.target.closest('[data-back]')) {
      (routes[workspaceReturnRoute] || routes.projects)();
      return;
    }
    if (event.target.closest('[data-open-task]')) {
      routes.projects();
      return;
    }
    const projectTarget = event.target.closest('.open-project, [data-open-project]');
    if (projectTarget) {
      const id = projectTarget.dataset.projectId || projectTarget.closest('[data-project-id]')?.dataset.projectId;
      if (id) openProject(id);
      return;
    }
    if (event.target.closest('button, input, select, textarea, a')) return;
    const projectCard = event.target.closest('.project-card');
    const id = projectCard?.dataset.projectId;
    if (id) openProject(id);
  });
  view.addEventListener('taskv:open-project', event => openProject(event.detail.id));

  const unmountSearch = mountGlobalSearch(root.querySelector('.search'), app, {
    openClient: clientId => {
      selectedClientId = clientId;
      openClientFromSearch = true;
      routes.clients();
    }
  });
  const unmountPersistenceStatus = mountPersistenceStatus(root.querySelector('[data-persistence-status]'), app);

  navigateTo('home', 'HomeView', renderHomeDashboard);
  const unmountNotifications = mountNotificationCenter(root.querySelector('[data-notification-center]'), app, {
    openProject,
    openTasks: routes.projects
  });
  const unmountAccountMenu = mountAccountMenu(root.querySelector('[data-account-menu]'), authUser, {
    navigate: route => routes[route]?.(),
    signOut: () => app.managers.get('AuthManager').signOut(),
    subscribeUser: listener => app.events.on('auth.changed', listener)
  });
  app.shellCleanup = () => {
    ui.destroyAll();
    app.modal.close();
    unmountNotifications();
    unmountAccountMenu();
    unmountSearch();
    unmountPersistenceStatus();
  };
}
