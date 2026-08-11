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
      <div class="project-progress-copy"><span>Delivery progress</span><strong>${progressLabel(finance.deliveredVideos, project.totalVideos)}</strong></div>
      <div class="progress-track project-progress"><span style="width:${progress(finance.deliveredVideos, project.totalVideos)}%"></span></div>
    </section>
  `;
  root.querySelector('[data-client]').textContent = client?.name || 'No client';
  root.querySelector('[data-deadline]').textContent = project.deadline ? formatDate(project.deadline) : 'No deadline';
  root.querySelector('[data-price]').textContent = money(project.pricePerVideo);
  root.querySelector('[data-total]').textContent = String(Number(project.totalVideos) || 0);
}

function progress(delivered, total) {
  const count = Number(total) || 0;
  return count ? Math.min((Number(delivered) / count) * 100, 100) : 0;
}

function progressLabel(delivered, total) {
  const count = Number(total) || 0;
  return count ? `${Number(delivered) || 0} of ${count}` : `${Number(delivered) || 0} delivered`;
}

function money(value) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0); }
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No deadline' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
