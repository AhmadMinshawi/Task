import { formatMoney, formatDate } from '../../utils/formatters.js';

export function renderProjectOverview(root, project, client, finance) {
  root.innerHTML = `
    <section class="dashboard-card project-overview-card">
      <div class="dashboard-card-head"><div><span class="eyebrow">Project details</span><h2>Overview</h2></div></div>
      <div class="project-detail-grid">
        <p><span>Client</span><strong data-client></strong></p>
        <p><span>Deadline</span><strong data-deadline></strong></p>
        <p><span>Price per video</span><strong data-price></strong></p>
        <p><span>Total videos</span><strong data-total></strong></p>
      </div>
      <div class="project-progress-copy"><span>Delivery progress</span><strong>${progressLabel(finance)}</strong></div>
      <div class="progress-track project-progress"><span style="width:${progress(finance)}%"></span></div>
    </section>
    <section class="dashboard-card project-notes-card">
      <div class="dashboard-card-head"><div><span class="eyebrow">Schedule</span><h2>Project notes</h2></div><button class="primary-action" type="button" data-add-project-note>+ Add note</button></div>
      <div class="project-note-list" data-project-notes></div>
    </section>
  `;
  root.querySelector('[data-client]').textContent = client?.name || 'No client';
  root.querySelector('[data-deadline]').textContent = project.deadline ? formatDate(project.deadline, 'No deadline') : 'No deadline';
  root.querySelector('[data-price]').textContent = formatMoney(project.pricePerVideo);
  root.querySelector('[data-total]').textContent = finance.hasFixedTotal ? String(Number(project.totalVideos)) : 'Open / unknown';
  renderNotes(root.querySelector('[data-project-notes]'), project.notes);
}

function renderNotes(root, notes) {
  const items = Array.isArray(notes) ? [...notes].sort((a, b) => String(a.date).localeCompare(String(b.date))) : [];
  if (!items.length) {
    root.innerHTML = '<p class="dashboard-empty">No dated notes for this project.</p>';
    return;
  }
  for (const note of items) {
    const row = document.createElement('article');
    row.className = 'project-note-row';
    row.dataset.projectNoteId = note.id;
    const date = document.createElement('strong');
    date.textContent = formatDate(note.date);
    const text = document.createElement('span');
    text.textContent = note.text;
    const actions = document.createElement('div');
    actions.className = 'row-menu-actions';
    actions.innerHTML = '<button class="row-action" type="button" data-edit-project-note>Edit</button><button class="row-action danger-action" type="button" data-delete-project-note>Delete</button>';
    row.append(date, text, actions);
    root.append(row);
  }
}

function progress(finance) {
  const count = finance.hasFixedTotal ? Number(finance.deliveredVideos) + Number(finance.remainingProjectVideos) : Number(finance.coveredVideos);
  return count ? Math.min((Number(finance.deliveredVideos) / count) * 100, 100) : 0;
}

function progressLabel(finance) {
  if (finance.hasFixedTotal) return `${finance.deliveredVideos} delivered · ${finance.remainingProjectVideos} remaining`;
  return `${finance.deliveredVideos} delivered · ${finance.remainingPaidVideos} funded videos left`;
}
