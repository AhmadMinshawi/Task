import { displayProjectStatus, projectStatusLabel } from '../../domains/projects/ProjectStatus.js';
import { openProjectForm } from './forms/ProjectForm.js';
import { openTaskForm } from './forms/TaskForm.js';
import { openFinanceRecordForm } from './forms/FinanceRecordForm.js';
import { renderProjectOverview } from './project/ProjectOverview.js';
import { renderProjectFinancePanel } from './project/ProjectFinancePanel.js';
import { renderProjectTasksPanel } from './project/ProjectTasksPanel.js';

export function renderProjectWorkspace(root, app, projectId) {
  if (!projectId) throw new Error('Project id is required');
  let activeTab = 'overview';
  root.innerHTML = `
    <div class="page-heading project-workspace-heading">
      <div><span class="eyebrow">Project workspace</span><h1 data-name></h1><small class="workspace-client" data-client-name></small></div>
      <div class="page-actions">
        <a class="secondary-action detail-link" data-project-link target="_blank" rel="noopener noreferrer" hidden>Open project link</a>
        <button type="button" class="secondary-action" data-edit-workspace-project>Edit project</button>
        <label class="status-control">Status<select data-project-status><option value="new">New</option><option value="in_progress">In progress</option><option value="ready">Ready to deliver</option><option value="completed">Completed</option></select></label>
        <button type="button" class="secondary-action" data-back>Back</button>
      </div>
    </div>
    <section class="project-summary" data-summary></section>
    <div class="workspace-tabs" role="tablist" aria-label="Project sections">
      <button type="button" data-workspace-tab="overview">Overview</button>
      <button type="button" data-workspace-tab="payments">Payments <span data-payment-count></span></button>
      <button type="button" data-workspace-tab="deliveries">Deliveries <span data-delivery-count></span></button>
      <button type="button" data-workspace-tab="tasks">Tasks <span data-project-task-count></span></button>
    </div>
    <div class="workspace-panel" data-workspace-panel></div>
  `;

  const statusSelect = root.querySelector('[data-project-status]');
  const panel = root.querySelector('[data-workspace-panel]');

  function currentData() {
    const state = app.state.get();
    const project = state.projects.find(item => item.id === projectId && !item.deletedAt);
    if (!project) return null;
    return {
      state,
      project,
      client: state.clients.find(item => item.id === project.clientId && !item.deletedAt),
      payments: state.payments.filter(item => item.projectId === projectId && !item.deletedAt && !item.archivedAt),
      deliveries: state.deliveries.filter(item => item.projectId === projectId && !item.deletedAt && !item.archivedAt),
      tasks: state.tasks.filter(item => item.projectId === projectId && !item.deletedAt && !item.archivedAt)
    };
  }

  function refresh() {
    const data = currentData();
    if (!data) {
      root.innerHTML = '<div class="empty-state"><strong>Project not found</strong><p>This project may have been deleted.</p></div>';
      return;
    }
    const { project, client, payments, deliveries, tasks } = data;
    const finance = app.managers.get('FinanceEngine').project(project, payments, deliveries);
    const status = displayProjectStatus(project);
    root.querySelector('[data-name]').textContent = project.name;
    root.querySelector('[data-client-name]').textContent = client?.name || 'No client assigned';
    statusSelect.value = project.status || 'new';
    statusSelect.className = `status-${status}`;
    const link = root.querySelector('[data-project-link]');
    link.hidden = !project.projectLink;
    if (project.projectLink) link.href = project.projectLink;
    else link.removeAttribute('href');
    root.querySelector('[data-payment-count]').textContent = String(payments.length);
    root.querySelector('[data-delivery-count]').textContent = String(deliveries.length);
    root.querySelector('[data-project-task-count]').textContent = String(tasks.length);
    root.querySelector('[data-summary]').replaceChildren(...summaryCards(project, finance, status));
    root.querySelectorAll('[data-workspace-tab]').forEach(button => {
      const selected = button.dataset.workspaceTab === activeTab;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    if (activeTab === 'overview') renderProjectOverview(panel, project, client, finance);
    else if (activeTab === 'payments') renderProjectFinancePanel(panel, 'payment', newest(payments));
    else if (activeTab === 'deliveries') renderProjectFinancePanel(panel, 'delivery', newest(deliveries));
    else renderProjectTasksPanel(panel, newest(tasks));
  }

  function handleClick(event) {
    const tab = event.target.closest('[data-workspace-tab]');
    if (tab) {
      activeTab = tab.dataset.workspaceTab;
      refresh();
      return;
    }
    const data = currentData();
    if (!data) return;
    if (event.target.closest('[data-edit-workspace-project]')) {
      openProjectForm(app, data.project);
      return;
    }
    const addRecord = event.target.closest('[data-add-record]');
    if (addRecord) {
      openFinanceRecordForm(app, { kind: addRecord.dataset.addRecord, projectId });
      return;
    }
    const recordRow = event.target.closest('[data-record-id]');
    if (recordRow) {
      const kind = recordRow.dataset.recordKind;
      const collection = kind === 'payment' ? data.payments : data.deliveries;
      const record = collection.find(item => item.id === recordRow.dataset.recordId);
      if (!record) return;
      if (event.target.closest('[data-edit-record]')) openFinanceRecordForm(app, { kind, projectId, record });
      else if (event.target.closest('[data-archive-record]')) app.managers.get('FinanceService').archive(kind, record.id);
      else if (event.target.closest('[data-delete-record]')) confirmAction(app, `Delete this ${kind}?`, 'The record will be removed from the active project history.', 'Delete', () => app.managers.get('FinanceService').remove(kind, record.id));
      return;
    }
    if (event.target.closest('[data-add-project-task]')) {
      openTaskForm(app, [data.project], null, { defaultProjectId: projectId, lockProject: true });
      return;
    }
    const taskRow = event.target.closest('[data-project-task-id]');
    if (!taskRow) return;
    const task = data.tasks.find(item => item.id === taskRow.dataset.projectTaskId);
    if (!task) return;
    const service = app.managers.get('TaskService');
    if (event.target.closest('[data-toggle-project-task]')) service.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    else if (event.target.closest('[data-edit-project-task]')) openTaskForm(app, [data.project], task, { defaultProjectId: projectId, lockProject: true });
    else if (event.target.closest('[data-archive-project-task]')) service.archive(task.id);
    else if (event.target.closest('[data-delete-project-task]')) confirmAction(app, 'Delete this task?', 'The task will be removed from the active project.', 'Delete', () => service.remove(task.id));
  }

  function handleStatus() {
    app.managers.get('ProjectService').update(projectId, { status: statusSelect.value });
  }

  root.addEventListener('click', handleClick);
  statusSelect.addEventListener('change', handleStatus);
  refresh();
  const unsubscribe = app.state.subscribe(refresh);
  return () => {
    unsubscribe();
    root.removeEventListener('click', handleClick);
    statusSelect.removeEventListener('change', handleStatus);
  };
}

function summaryCards(project, finance, status) {
  const data = [
    ['Status', projectStatusLabel(status), `status-text status-${status}`],
    ['Project value', money(finance.grossProjectValue)],
    ['Paid', money(finance.paid)],
    ['Delivered', String(finance.deliveredVideos)],
    ['Videos left', String(finance.remainingProjectVideos)],
    ['Paid work left', money(finance.remainingPaidValue)]
  ];
  return data.map(([label, value, className = '']) => {
    const card = document.createElement('div');
    const labelNode = document.createElement('span');
    labelNode.textContent = label;
    const valueNode = document.createElement('strong');
    valueNode.className = className;
    valueNode.textContent = value;
    card.append(labelNode, valueNode);
    return card;
  });
}

function newest(items) {
  return [...items].sort((a, b) => String(b.date || b.dueDate || b.createdAt).localeCompare(String(a.date || a.dueDate || a.createdAt)));
}

function confirmAction(app, title, message, buttonText, onConfirm) {
  const content = document.createElement('div');
  content.innerHTML = '<div class="modal-heading"><span class="eyebrow">Confirm action</span><h2></h2><p></p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm></button></div>';
  content.querySelector('h2').textContent = title;
  content.querySelector('p').textContent = message;
  content.querySelector('[data-confirm]').textContent = buttonText;
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { onConfirm(); app.modal.close(); });
  app.modal.open(content);
}

function money(value) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0); }
