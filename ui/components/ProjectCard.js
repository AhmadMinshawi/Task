import { displayProjectStatus, projectStatusLabel } from '../../domains/projects/ProjectStatus.js';
import { formatMoney } from '../utils/formatters.js';

export function createProjectCard(project, finance, issues = []) {
  const el = document.createElement('article');
  el.className = 'project-card';
  el.dataset.projectId = project.id;

  const head = document.createElement('div');
  head.className = 'project-card-head';

  const info = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  const status = displayProjectStatus(project);
  eyebrow.classList.add('project-status', `status-${status}`);
  eyebrow.textContent = projectStatusLabel(status);
  const title = document.createElement('h3');
  title.textContent = project.name;
  const type = document.createElement('small');
  type.className = `project-type project-type-${project.projectType === 'large' ? 'large' : 'quick'}`;
  type.textContent = project.projectType === 'large' ? 'Large project' : 'Quick project';
  info.append(eyebrow, title, type);
  if (issues.length) {
    const warning = document.createElement('small');
    warning.className = 'project-integrity-badge';
    warning.textContent = 'يحتاج مراجعة';
    warning.title = issues.map(issue => issue.message).join('\n');
    info.append(warning);
  }

  const pin = document.createElement('button');
  pin.className = 'pin-button';
  pin.type = 'button';
  pin.dataset.pinProject = project.id;
  pin.setAttribute('aria-label', project.pinned ? 'Unpin project' : 'Pin project');
  pin.setAttribute('aria-pressed', String(Boolean(project.pinned)));
  pin.textContent = project.pinned ? '★' : '☆';
  head.append(info, pin);

  const metrics = document.createElement('div');
  metrics.className = 'project-metrics';
  metrics.append(
    metric('Price / video', formatMoney(project.pricePerVideo)),
    metric('Paid', formatMoney(finance.paid)),
    metric(finance.hasFixedTotal ? 'Still due' : 'Balance left', formatMoney(finance.hasFixedTotal ? finance.outstandingAmount : finance.remainingPaidValue)),
    metric(finance.hasFixedTotal ? 'Videos left' : 'Funded videos left', String(finance.remainingProjectVideos))
  );

  const foot = document.createElement('div');
  foot.className = 'project-card-foot';
  const remaining = document.createElement('span');
  remaining.textContent = finance.hasFixedTotal ? `${formatMoney(finance.grossProjectValue)} total value` : 'Open total · prepaid balance';
  const open = document.createElement('button');
  open.className = 'open-project';
  open.type = 'button';
  open.dataset.projectId = project.id;
  open.textContent = 'Open';
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  if (project.archivedAt) {
    const restore = document.createElement('button');
    restore.className = 'row-action';
    restore.type = 'button';
    restore.dataset.restoreProject = project.id;
    restore.textContent = 'Restore';
    actions.append(restore);
  } else {
    const edit = document.createElement('button');
    edit.className = 'row-action';
    edit.type = 'button';
    edit.dataset.editProject = project.id;
    edit.textContent = 'Edit';
    const archive = document.createElement('button');
    archive.className = 'row-action';
    archive.type = 'button';
    archive.dataset.archiveProject = project.id;
    archive.textContent = 'Archive';
    actions.append(open, edit, archive);
  }
  const remove = document.createElement('button');
  remove.className = 'row-action danger-action';
  remove.type = 'button';
  remove.dataset.deleteProject = project.id;
  remove.textContent = 'Delete';
  actions.append(remove);
  foot.append(remaining, actions);

  el.append(head, metrics, foot);
  return el;
}

function metric(label, value) {
  const wrapper = document.createElement('div');
  const text = document.createElement('span');
  text.textContent = label;
  const valueEl = document.createElement('strong');
  valueEl.textContent = value;
  wrapper.append(text, valueEl);
  return wrapper;
}
