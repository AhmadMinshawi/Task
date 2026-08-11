import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';

export function renderHomeDashboard(root, app) {
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Overview</span><h1>Command Center</h1></div>
      <button class="expense-launch" type="button" data-add-expense aria-label="Add expense" title="Add expense"><span>＋</span></button>
    </div>
    <div class="overview-stats" data-overview-stats></div>
    <section class="home-total-card" data-home-total>
      <div class="home-total-heading"><div><span class="eyebrow">This month</span><h2>Financial total</h2></div><strong data-total-month></strong></div>
      <div class="home-total-grid">
        <div><span>Income</span><strong class="positive" data-total-income></strong></div>
        <div><span>Expenses</span><strong class="negative" data-total-expenses></strong></div>
        <div class="net"><span>Net total</span><strong data-total-net></strong></div>
      </div>
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
    const stats = [
      ['Clients', state.clients.filter(x => !x.deletedAt && !x.archivedAt).length],
      ['Projects', state.projects.filter(x => !x.deletedAt && !x.archivedAt).length],
      ['Open tasks', state.tasks.filter(x => !x.deletedAt && !x.archivedAt && !['done', 'cancelled'].includes(x.status)).length],
      ['Delivered videos', state.deliveries.filter(x => !x.deletedAt && !x.archivedAt).reduce((sum, x) => sum + Number(x.quantity || 0), 0)]
    ];
    const container = root.querySelector('[data-overview-stats]');
    container.replaceChildren(...stats.map(([label, value]) => {
      const card = document.createElement('article');
      card.append(textNode('span', '', label), textNode('strong', '', String(value)));
      return card;
    }));
  }

  function renderFinancialTotal(state) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const visible = item => !item.deletedAt && !item.archivedAt;
    const total = app.managers.get('FinanceEngine').monthly(
      state.payments.filter(visible),
      state.expenses.filter(visible),
      month,
      state.tasks.filter(task => visible(task) && !task.projectId)
    );
    root.querySelector('[data-total-month]').textContent = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(now);
    root.querySelector('[data-total-income]').textContent = money(total.collected);
    root.querySelector('[data-total-expenses]').textContent = money(total.expenses);
    const net = root.querySelector('[data-total-net]');
    net.textContent = money(total.netCollected);
    net.className = total.netCollected < 0 ? 'negative' : 'positive';
  }

  const refresh = () => {
    const state = app.state.get();
    renderOverview(state);
    renderFinancialTotal(state);
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
