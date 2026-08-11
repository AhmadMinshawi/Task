import { renderFinanceSummary } from './FinanceSummary.js';
import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';

export function renderHomeDashboard(root, app) {
  let financeHidden = false;
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Overview</span><h1>Command Center</h1></div>
      <span class="dashboard-period" data-period></span>
    </div>
    <div class="overview-stats" data-overview-stats></div>
    <div data-finance-summary></div>
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
      <div class="dashboard-expense" data-expense-add></div>
      <section class="dashboard-card dashboard-health">
        <span class="eyebrow">Workspace health</span>
        <h2>At a glance</h2>
        <div class="health-grid" data-health></div>
      </section>
    </div>
  `;

  const month = new Date().toISOString().slice(0, 7);
  root.querySelector('[data-period]').textContent = new Intl.DateTimeFormat('en', {
    month: 'long', year: 'numeric'
  }).format(new Date());

  function textNode(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function renderProjects(state) {
    const container = root.querySelector('[data-active-projects]');
    const projects = state.projects
      .filter(project => !project.deletedAt)
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 4);
    root.querySelector('[data-project-count]').textContent = `${state.projects.filter(x => !x.deletedAt).length} total`;
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
    const active = state.tasks.filter(task => !task.deletedAt && task.status !== 'done' && task.status !== 'cancelled');
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

  function renderOverview(state, finance) {
    const stats = [
      ['Clients', state.clients.filter(x => !x.deletedAt).length],
      ['Projects', state.projects.filter(x => !x.deletedAt).length],
      ['Open tasks', state.tasks.filter(x => !x.deletedAt && !['done', 'cancelled'].includes(x.status)).length],
      ['Delivered videos', state.deliveries.filter(x => !x.deletedAt).reduce((sum, x) => sum + Number(x.quantity || 0), 0)]
    ];
    const container = root.querySelector('[data-overview-stats]');
    container.replaceChildren(...stats.map(([label, value]) => {
      const card = document.createElement('article');
      card.append(textNode('span', '', label), textNode('strong', '', String(value)));
      return card;
    }));

    const health = root.querySelector('[data-health]');
    health.replaceChildren();
    for (const [label, value] of [
      ['Portfolio value', money(finance.projectValue, financeHidden)],
      ['Collected all time', money(finance.allTimeCollected, financeHidden)],
      ['Payments', state.payments.filter(x => !x.deletedAt).length],
      ['Expenses', state.expenses.filter(x => !x.deletedAt).length]
    ]) {
      const item = document.createElement('div');
      item.append(textNode('span', '', label), textNode('strong', '', String(value)));
      health.append(item);
    }
  }

  const refresh = () => {
    const state = app.state.get();
    const summary = app.managers.get('FinanceManager').portfolioSummary(month);
    renderFinanceSummary(root.querySelector('[data-finance-summary]'), summary, {
      hidden: financeHidden,
      onToggle: () => {
        financeHidden = !financeHidden;
        refresh();
      }
    });
    renderOverview(state, summary);
    renderProjects(state);
    renderTasks(state);
  };

  refresh();

  renderExpenseQuickAdd(root.querySelector('[data-expense-add]'), async data => {
    app.managers.get('ExpenseService').create(data);
    refresh();
  });

  const handleTaskCompletion = event => {
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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function money(value, hidden) {
  if (hidden) return '•••••';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0);
}
