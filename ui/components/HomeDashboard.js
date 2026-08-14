import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';
import { openProjectNoteForm } from './forms/ProjectNoteForm.js';
import { activeRecords } from '../../core/recordState.js';
import { formatMoney, localDateKey } from '../utils/formatters.js';

export function renderHomeDashboard(root, app) {
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Overview</span><h1>Command Center</h1></div>
      <button class="expense-launch" type="button" data-add-expense aria-label="Add expense" title="Add expense"><span>＋</span></button>
    </div>
    <div class="quick-note-bar"><button class="primary-action" type="button" data-add-note>+ Quick note</button></div>
    <div class="overview-stats" data-overview-stats></div>
    <div class="dashboard-grid">
      <section class="dashboard-card dashboard-projects">
        <div class="dashboard-card-head"><div><span class="eyebrow">Workspace</span><h2>Active projects</h2></div><span class="dashboard-count" data-project-count></span></div>
        <div class="dashboard-list" data-active-projects></div>
      </section>
      <section class="dashboard-card dashboard-tasks">
        <div class="dashboard-card-head"><div><span class="eyebrow">Today</span><h2>Today's plan</h2><small>Drag items to set your priority</small></div><span class="dashboard-count" data-plan-count></span></div>
        <div class="dashboard-list today-plan-list" data-today-plan></div>
      </section>
    </div>`;

  const textNode = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  };

  function renderOverview(state) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const portfolio = app.managers.get('FinanceManager').portfolioSummary(month);
    const projects = activeRecords(state.projects);
    let completedProjects = 0;
    let videosLeft = 0;
    for (const project of projects) {
      const summary = app.managers.get('FinanceManager').projectSummary(project.id);
      const total = Number(project.totalVideos) || 0;
      if (project.status === 'completed' || (total > 0 && summary.deliveredVideos >= total)) completedProjects += 1;
      videosLeft += summary.remainingProjectVideos;
    }
    const stats = [
      ['Monthly total', formatMoney(portfolio.collected), 'monthly'],
      ['Due from clients', formatMoney(portfolio.outstanding), 'due'],
      ['Completed projects', completedProjects, 'complete'],
      ['Videos left to deliver', videosLeft, 'delivery']
    ];
    root.querySelector('[data-overview-stats]').replaceChildren(...stats.map(([label, value, kind]) => {
      const card = document.createElement('article');
      card.className = `command-stat ${kind}`;
      card.append(textNode('span', '', label), textNode('strong', '', String(value)));
      return card;
    }));
  }

  function renderProjects(state) {
    const container = root.querySelector('[data-active-projects]');
    const all = activeRecords(state.projects);
    const projects = [...all].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))).slice(0, 4);
    root.querySelector('[data-project-count]').textContent = `${all.length} total`;
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
      const remainingLabel = summary.hasFixedTotal ? `${summary.remainingProjectVideos} remaining` : `${summary.remainingPaidVideos} funded`;
      copy.append(textNode('strong', '', project.name), textNode('small', '', `${summary.deliveredVideos} delivered · ${remainingLabel}`));
      const progress = document.createElement('div');
      progress.className = 'progress-track';
      const bar = document.createElement('span');
      const total = summary.hasFixedTotal ? Number(project.totalVideos) : Number(summary.coveredVideos);
      bar.style.width = `${total ? Math.min((summary.deliveredVideos / total) * 100, 100) : 0}%`;
      progress.append(bar);
      const open = textNode('button', 'open-project', 'Open');
      open.type = 'button';
      open.dataset.projectId = project.id;
      item.append(copy, progress, open);
      container.append(item);
    }
  }

  function renderToday(state) {
    const today = localDateKey(new Date());
    const items = todayItems(state, today);
    const saved = Array.isArray(state.todayOrder?.[today]) ? state.todayOrder[today] : [];
    const order = new Map(saved.map((id, index) => [id, index]));
    items.sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER));
    const container = root.querySelector('[data-today-plan]');
    root.querySelector('[data-plan-count]').textContent = `${items.length} today`;
    container.replaceChildren();
    if (!items.length) {
      container.append(textNode('p', 'dashboard-empty', 'Nothing scheduled for today.'));
      return;
    }
    for (const plan of items) {
      const row = document.createElement('article');
      row.className = 'dashboard-task-row today-plan-row';
      row.draggable = true;
      row.dataset.todayItem = plan.id;
      row.dataset.projectId = plan.projectId;
      const copy = document.createElement('div');
      copy.append(textNode('strong', '', plan.title), textNode('small', '', plan.projectName));
      row.append(textNode('span', 'drag-handle', '⋮⋮'), copy, textNode('span', `task-status ${plan.type}`, plan.type === 'deadline' ? 'Deadline' : 'Note'));
      container.append(row);
    }
  }

  const refresh = () => {
    const state = app.state.get();
    renderOverview(state);
    renderProjects(state);
    renderToday(state);
  };
  refresh();

  const handleClick = event => {
    if (event.target.closest('[data-add-note]')) {
      openProjectNoteForm(app);
      return;
    }
    if (event.target.closest('[data-add-expense]')) openExpenseModal(app);
  };
  root.addEventListener('click', handleClick);

  const list = root.querySelector('[data-today-plan]');
  let draggingId = null;
  const handleDragStart = event => {
    const row = event.target.closest('[data-today-item]');
    if (!row) return;
    draggingId = row.dataset.todayItem;
    row.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = event => {
    if (!draggingId) return;
    event.preventDefault();
    const target = event.target.closest('[data-today-item]');
    const dragging = [...list.querySelectorAll('[data-today-item]')].find(row => row.dataset.todayItem === draggingId);
    if (!target || !dragging || target === dragging) return;
    const box = target.getBoundingClientRect();
    list.insertBefore(dragging, event.clientY < box.top + box.height / 2 ? target : target.nextSibling);
  };
  const handleDragEnd = () => {
    if (!draggingId) return;
    list.querySelector('.is-dragging')?.classList.remove('is-dragging');
    const ids = [...list.querySelectorAll('[data-today-item]')].map(row => row.dataset.todayItem);
    const today = localDateKey(new Date());
    draggingId = null;
    app.state.update(state => { state.todayOrder = { ...(state.todayOrder || {}), [today]: ids }; });
  };
  list.addEventListener('dragstart', handleDragStart);
  list.addEventListener('dragover', handleDragOver);
  list.addEventListener('dragend', handleDragEnd);

  const unsubscribe = app.state.subscribe(refresh);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
    list.removeEventListener('dragstart', handleDragStart);
    list.removeEventListener('dragover', handleDragOver);
    list.removeEventListener('dragend', handleDragEnd);
  };
}

function todayItems(state, today) {
  return activeRecords(state.projects).flatMap(project => {
    const items = [];
    if (String(project.deadline || '').slice(0, 10) === today) items.push({ id: `deadline:${project.id}`, projectId: project.id, projectName: project.name, title: `Deliver ${project.name}`, type: 'deadline' });
    for (const note of Array.isArray(project.notes) ? project.notes : []) {
      if (String(note.date || '').slice(0, 10) === today) items.push({ id: `note:${project.id}:${note.id}`, projectId: project.id, projectName: project.name, title: note.text, type: 'note' });
    }
    return items;
  });
}

function openExpenseModal(app) {
  const content = document.createElement('div');
  content.innerHTML = '<div class="modal-heading"><span class="eyebrow">Finance</span><h2>Add expense</h2><p>Record a business expense without leaving the dashboard.</p></div><div data-expense-form></div>';
  renderExpenseQuickAdd(content.querySelector('[data-expense-form]'), data => {
    app.managers.get('ExpenseService').create(data);
    app.modal.close();
  });
  app.modal.open(content);
  content.querySelector('[name="amount"]').focus();
}
