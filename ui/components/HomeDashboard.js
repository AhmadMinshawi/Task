import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';
import { deadlineLabel } from '../../services/DeadlineManager.js';

export function renderHomeDashboard(root, app) {
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Overview</span><h1>Command Center</h1></div>
      <button class="expense-launch" type="button" data-add-expense aria-label="Add expense" title="Add expense"><span>＋</span></button>
    </div>
    <div class="overview-stats" data-overview-stats></div>
    <section class="dashboard-card deadline-panel">
      <div class="dashboard-card-head"><div><span class="eyebrow">Attention</span><h2>Deadlines</h2></div><span class="dashboard-count" data-deadline-count></span></div>
      <div class="deadline-list" data-deadlines></div>
    </section>
    <div class="dashboard-grid">
      <section class="dashboard-card dashboard-projects">
        <div class="dashboard-card-head">
          <div><span class="eyebrow">Workspace</span><h2>Active projects</h2></div>
          <span class="dashboard-count" data-project-count></span>
        </div>
        <div class="dashboard-list" data-active-projects></div>
      </section>
      <section class="dashboard-card dashboard-tasks">
        <div class="dashboard-card-head">
          <div><span class="eyebrow">Execution</span><h2>Next tasks</h2></div>
          <span class="dashboard-count" data-task-count></span>
        </div>
        <div class="dashboard-list" data-next-tasks></div>
      </section>
    </div>
  `;

  function textNode(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function renderProjects(state) {
    const container = root.querySelector('[data-active-projects]');
    const projects = state.projects
      .filter(project => !project.deletedAt && !project.archivedAt)
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
      .slice(0, 4);
    root.querySelector('[data-project-count]').textContent = `${state.projects.filter(x => !x.deletedAt && !x.archivedAt).length} total`;
    container.replaceChildren();

    if (!projects.length) {
      container.append(textNode('p', 'dashboard-empty', 'Create your first project to start tracking work and payments.'));
      return;
    }

    for (const project of projects) {
      const summary = app.managers.get('FinanceManager').projectSummary(project.id);
      const item = document.createElement('article');
      item.className = 'dashboard-project-row';
      item.dataset.projectId = project.id;
      const copy = document.createElement('div');
      copy.append(
        textNode('strong', '', project.name),
        textNode('small', '', `${summary.deliveredVideos} delivered · ${summary.remainingProjectVideos} remaining`)
      );
      const progress = document.createElement('div');
      progress.className = 'progress-track';
      const bar = document.createElement('span');
      const total = Number(project.totalVideos) || 0;
      bar.style.width = `${total ? Math.min((summary.deliveredVideos / total) * 100, 100) : 0}%`;
      progress.append(bar);
      const open = textNode('button', 'open-project', 'Open');
      open.type = 'button';
      open.dataset.projectId = project.id;
      item.append(copy, progress, open);
      container.append(item);
    }
  }

  function renderTasks(state) {
    const container = root.querySelector('[data-next-tasks]');
    const active = state.tasks.filter(task => !task.deletedAt && !task.archivedAt && task.status !== 'done' && task.status !== 'cancelled');
    root.querySelector('[data-task-count]').textContent = `${active.length} open`;
    const tasks = active.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return String(a.dueDate).localeCompare(String(b.dueDate));
    }).slice(0, 5);
    container.replaceChildren();

    if (!tasks.length) {
      container.append(textNode('p', 'dashboard-empty', 'No open tasks. Your workspace is clear.'));
      return;
    }

    for (const task of tasks) {
      const project = state.projects.find(x => x.id === task.projectId && !x.deletedAt);
      const item = document.createElement('article');
      item.className = 'dashboard-task-row';
      const toggle = textNode('button', 'task-check', '✓');
      toggle.type = 'button';
      toggle.dataset.completeTask = task.id;
      toggle.setAttribute('aria-label', `Complete ${task.title}`);
      const copy = document.createElement('div');
      copy.append(
        textNode('strong', '', task.title),
        textNode('small', '', `${project?.name || 'Unknown project'}${task.dueDate ? ` · ${formatDate(task.dueDate)}` : ''}`)
      );
      item.append(toggle, copy, textNode('span', 'task-status', task.status.replace('_', ' ')));
      container.append(item);
    }
  }

  function renderOverview(state) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const portfolio = app.managers.get('FinanceManager').portfolioSummary(month);
    const projects = state.projects.filter(project => !project.deletedAt && !project.archivedAt);
    let completedProjects = 0;
    let videosLeft = 0;
    for (const project of projects) {
      const summary = app.managers.get('FinanceManager').projectSummary(project.id);
      const totalVideos = Number(project.totalVideos) || 0;
      if (project.status === 'completed' || (totalVideos > 0 && summary.deliveredVideos >= totalVideos)) completedProjects += 1;
      videosLeft += summary.remainingProjectVideos;
    }
    const stats = [
      ['Monthly total', money(portfolio.collected), 'monthly'],
      ['Due from clients', money(portfolio.outstanding), 'due'],
      ['Completed projects', completedProjects, 'complete'],
      ['Videos left to deliver', videosLeft, 'delivery']
    ];
    const container = root.querySelector('[data-overview-stats]');
    container.replaceChildren(...stats.map(([label, value, kind]) => {
      const card = document.createElement('article');
      card.className = `command-stat ${kind}`;
      card.append(textNode('span', '', label), textNode('strong', '', String(value)));
      return card;
    }));
  }

  function renderDeadlines() {
    const alerts = app.managers.get('DeadlineManager').alerts();
    const container = root.querySelector('[data-deadlines]');
    root.querySelector('[data-deadline-count]').textContent = `${alerts.length} alert${alerts.length === 1 ? '' : 's'}`;
    container.replaceChildren();
    if (!alerts.length) {
      container.append(textNode('p', 'dashboard-empty', 'No overdue or upcoming deadlines in the next 7 days.'));
      return;
    }
    for (const alert of alerts.slice(0, 8)) {
      const row = document.createElement('article');
      row.className = `deadline-row urgency-${alert.urgency}`;
      row.dataset[alert.type === 'project' ? 'openProject' : 'openTask'] = '';
      row.dataset[alert.type === 'project' ? 'projectId' : 'taskId'] = alert.id;
      const badge = textNode('span', 'deadline-kind', alert.type === 'project' ? 'P' : 'T');
      const copy = document.createElement('div');
      copy.append(textNode('strong', '', alert.title), textNode('small', '', `${alert.type === 'project' ? 'Project' : 'Task'} · ${formatDate(alert.date)}`));
      row.append(badge, copy, textNode('strong', 'deadline-label', deadlineLabel(alert)));
      container.append(row);
    }
  }

  const refresh = () => {
    const state = app.state.get();
    renderOverview(state);
    renderDeadlines();
    renderProjects(state);
    renderTasks(state);
  };

  refresh();

  const handleTaskCompletion = event => {
    if (event.target.closest('[data-add-expense]')) {
      openExpenseModal(app);
      return;
    }
    const button = event.target.closest('[data-complete-task]');
    if (!button) return;
    app.managers.get('TaskService').update(button.dataset.completeTask, { status: 'done' });
  };
  root.addEventListener('click', handleTaskCompletion);

  const unsubscribe = app.state.subscribe(refresh);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleTaskCompletion);
  };
}

function money(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function openExpenseModal(app) {
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Finance</span><h2>Add expense</h2><p>Record a business expense without leaving the dashboard.</p></div><div data-expense-form></div>`;
  renderExpenseQuickAdd(content.querySelector('[data-expense-form]'), data => {
    app.managers.get('ExpenseService').create(data);
    app.modal.close();
  });
  app.modal.open(content);
  content.querySelector('[name="amount"]').focus();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}
