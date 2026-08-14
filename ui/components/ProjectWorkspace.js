import { displayProjectStatus } from '../../domains/projects/ProjectStatus.js';
import { openProjectForm } from './forms/ProjectForm.js';
import { openFinanceRecordForm } from './forms/FinanceRecordForm.js';
import { openProjectNoteForm } from './forms/ProjectNoteForm.js';
import { renderProjectOverview } from './project/ProjectOverview.js';
import { renderProjectFinancePanel } from './project/ProjectFinancePanel.js';
import { projectIntegrityIssues } from '../../domains/projects/ProjectIntegrity.js';
import { activeProjectRecords } from '../../core/recordState.js';
import { formatMoney } from '../utils/formatters.js';

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
    <div data-integrity-issues></div>
    <section class="project-summary" data-summary></section>
    <div class="workspace-tabs" role="tablist" aria-label="Project sections">
      <button type="button" data-workspace-tab="overview">Overview</button>
      <button type="button" data-workspace-tab="payments">Payments <span data-payment-count></span></button>
      <button type="button" data-workspace-tab="deliveries">Deliveries <span data-delivery-count></span></button>
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
      payments: activeProjectRecords(state.payments, projectId),
      deliveries: activeProjectRecords(state.deliveries, projectId)
    };
  }

  function refresh() {
    const data = currentData();
    if (!data) {
      root.innerHTML = '<div class="empty-state"><strong>Project not found</strong><p>This project may have been deleted.</p></div>';
      return;
    }
    const { state, project, client, payments, deliveries } = data;
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
    root.querySelector('[data-summary]').replaceChildren(...summaryCards(project, finance, status));
    renderIntegrityIssues(root.querySelector('[data-integrity-issues]'), projectIntegrityIssues(state, project));
    root.querySelectorAll('[data-workspace-tab]').forEach(button => {
      const selected = button.dataset.workspaceTab === activeTab;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    if (activeTab === 'overview') renderProjectOverview(panel, project, client, finance);
    else if (activeTab === 'payments') renderProjectFinancePanel(panel, 'payment', newest(payments));
    else if (activeTab === 'deliveries') renderProjectFinancePanel(panel, 'delivery', newest(deliveries));
    else renderProjectFinancePanel(panel, 'delivery', newest(deliveries));
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
    if (event.target.closest('[data-add-project-note]')) {
      openProjectNoteForm(app, { projectId, lockProject: true });
      return;
    }
    const noteRow = event.target.closest('[data-project-note-id]');
    if (noteRow) {
      const note = (Array.isArray(data.project.notes) ? data.project.notes : []).find(item => item.id === noteRow.dataset.projectNoteId);
      if (!note) return;
      if (event.target.closest('[data-edit-project-note]')) openProjectNoteForm(app, { projectId, note, lockProject: true });
      else if (event.target.closest('[data-delete-project-note]')) confirmAction(app, 'Delete this note?', 'This reminder will be removed from the project, home and calendar.', 'Delete', () => app.managers.get('ProjectNoteService').remove(projectId, note.id));
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
  }

  function handleStatus() {
    try {
      app.managers.get('ProjectService').update(projectId, { status: statusSelect.value });
    } catch (error) {
      statusSelect.value = currentData()?.project.status || 'new';
      showValidationError(app, error.message || 'Could not change project status.');
    }
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
  const data = finance.hasFixedTotal ? [
    ['Type', project.projectType === 'large' ? 'Large' : 'Quick'],
    ['Project value', formatMoney(finance.grossProjectValue)],
    ['Paid', formatMoney(finance.paid)],
    ['Still due', formatMoney(finance.outstandingAmount)],
    ['Delivered', String(finance.deliveredVideos)],
    ['Videos left', String(finance.remainingProjectVideos)]
  ] : [
    ['Type', project.projectType === 'large' ? 'Large' : 'Quick'],
    ['Billing', 'Open prepaid'],
    ['Paid', formatMoney(finance.paid)],
    ['Balance left', formatMoney(finance.remainingPaidValue)],
    ['Delivered', String(finance.deliveredVideos)],
    ['Funded videos left', String(finance.remainingPaidVideos)]
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

function renderIntegrityIssues(root, issues) {
  root.replaceChildren();
  if (!issues.length) return;
  const alert = document.createElement('section');
  alert.className = 'integrity-alert';
  const heading = document.createElement('strong');
  heading.textContent = 'هذا المشروع يحتاج مراجعة';
  const list = document.createElement('ul');
  for (const issue of issues) {
    const item = document.createElement('li');
    item.textContent = issue.message;
    list.append(item);
  }
  alert.append(heading, list);
  root.append(alert);
}

function showValidationError(app, message) {
  const content = document.createElement('div');
  content.innerHTML = '<div class="modal-heading"><span class="eyebrow">Data protection</span><h2>لا يمكن تنفيذ التغيير</h2><p></p></div><div class="modal-actions"><button class="primary-action" type="button" data-close>حسنًا</button></div>';
  content.querySelector('p').textContent = message;
  content.querySelector('[data-close]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
}
