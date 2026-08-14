import { formatMoney } from '../utils/formatters.js';

export function renderFinanceReports(root, reports, { hidden = false, onOpenProject } = {}) {
  const { months, clients, projects } = reports;
  root.innerHTML = `
    <section class="dashboard-card report-section">
      <div class="dashboard-card-head"><div><span class="eyebrow">Analytics</span><h2>آخر 6 أشهر</h2></div></div>
      <div class="report-months" data-report-months></div>
    </section>
    <div class="report-columns">
      <section class="dashboard-card report-section">
        <div class="dashboard-card-head"><div><span class="eyebrow">Clients</span><h2>حسابات العملاء</h2></div><span class="dashboard-count">${clients.length}</span></div>
        <div class="report-table" data-client-reports></div>
      </section>
      <section class="dashboard-card report-section">
        <div class="dashboard-card-head"><div><span class="eyebrow">Projects</span><h2>حالة المشروعات</h2></div><span class="dashboard-count">${projects.length}</span></div>
        <div class="report-table" data-project-reports></div>
      </section>
    </div>`;

  renderMonths(root.querySelector('[data-report-months]'), months, hidden);
  renderClients(root.querySelector('[data-client-reports]'), clients, hidden);
  renderProjects(root.querySelector('[data-project-reports]'), projects, hidden, onOpenProject);
}

function renderMonths(root, months, hidden) {
  const maximum = Math.max(1, ...months.map(month => Math.max(month.collected, month.expenses)));
  for (const month of months) {
    const item = document.createElement('article');
    item.className = 'report-month';
    item.innerHTML = `<strong>${monthLabel(month.month)}</strong><div class="report-bars"><i class="income"></i><i class="expense"></i></div><small></small>`;
    item.querySelector('.income').style.height = `${Math.max(3, (month.collected / maximum) * 100)}%`;
    item.querySelector('.expense').style.height = `${Math.max(3, (month.expenses / maximum) * 100)}%`;
    item.querySelector('small').textContent = hidden ? '••••' : `صافي ${formatMoney(month.netCollected)}`;
    root.append(item);
  }
}

function renderClients(root, clients, hidden) {
  if (!clients.length) return empty(root, 'ستظهر حسابات العملاء بعد إضافة مشروعات.');
  for (const report of clients) {
    const row = document.createElement('article');
    row.className = 'report-row';
    row.innerHTML = '<div><strong></strong><small></small></div><div class="report-values"><span></span><b></b></div>';
    row.querySelector('strong').textContent = report.client.name || 'عميل بدون اسم';
    row.querySelector('small').textContent = `${report.projectCount} مشروع · ${report.deliveredVideos} مسلم · ${report.remainingVideos} متبقي`;
    row.querySelector('span').textContent = hidden ? '••••' : `دفع ${formatMoney(report.paid)}`;
    row.querySelector('b').textContent = hidden ? '••••' : `متبقي ${formatMoney(report.outstanding)}`;
    root.append(row);
  }
}

function renderProjects(root, projects, hidden, onOpenProject) {
  if (!projects.length) return empty(root, 'ستظهر تحليلات المشروعات هنا.');
  for (const report of projects) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'report-row report-project';
    button.innerHTML = '<div><strong></strong><small></small></div><div class="report-values"><span></span><b></b></div>';
    button.querySelector('strong').textContent = report.project.name || 'مشروع بدون اسم';
    button.querySelector('small').textContent = `${report.client?.name || 'بدون عميل'} · تسليم ${percent(report.deliveryRate)}`;
    button.querySelector('span').textContent = hidden ? '••••' : report.hasFixedTotal ? `تحصيل ${percent(report.collectionRate)}` : `رصيد ${formatMoney(report.remainingPaidValue)}`;
    button.querySelector('b').textContent = hidden ? '••••' : `متبقي ${formatMoney(report.outstandingAmount)}`;
    button.addEventListener('click', () => onOpenProject?.(report.project.id));
    root.append(button);
  }
}

function empty(root, message) { root.innerHTML = `<p class="dashboard-empty">${message}</p>`; }
function percent(value) { return `${Math.round(Math.min(Math.max(Number(value) || 0, 0), 1) * 100)}%`; }
function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(new Date(year, month - 1, 1));
}
