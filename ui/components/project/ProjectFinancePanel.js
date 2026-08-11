export function renderProjectFinancePanel(root, kind, records) {
  const isPayment = kind === 'payment';
  root.innerHTML = `
    <section class="dashboard-card project-records-card">
      <div class="dashboard-card-head"><div><span class="eyebrow">${isPayment ? 'Income' : 'Production'}</span><h2>${isPayment ? 'Payments' : 'Deliveries'}</h2></div><button class="primary-action" type="button" data-add-record="${kind}">${isPayment ? 'Add payment' : 'Record delivery'}</button></div>
      <div class="project-record-list" data-record-list></div>
    </section>
  `;
  const list = root.querySelector('[data-record-list]');
  if (!records.length) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = isPayment ? 'No payments recorded for this project.' : 'No deliveries recorded for this project.';
    list.append(empty);
    return;
  }
  for (const record of records) {
    const row = document.createElement('article');
    row.className = 'project-record-row';
    row.dataset.recordId = record.id;
    row.dataset.recordKind = kind;
    const marker = document.createElement('span');
    marker.className = `ledger-badge ${isPayment ? 'positive' : 'neutral'}`;
    marker.textContent = isPayment ? 'P' : 'D';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = record.title || (isPayment ? 'Payment' : 'Delivery');
    const date = document.createElement('small');
    date.textContent = formatDate(record.date || record.createdAt);
    copy.append(title, date);
    const value = document.createElement('strong');
    value.className = `ledger-value ${isPayment ? 'positive' : 'neutral'}`;
    value.textContent = isPayment ? money(record.amount) : `${Number(record.quantity) || 0} videos`;
    const actions = document.createElement('div');
    actions.className = 'row-menu-actions';
    actions.innerHTML = `<button class="row-action" type="button" data-edit-record>Edit</button><button class="row-action" type="button" data-archive-record>Archive</button><button class="row-action danger-action" type="button" data-delete-record>Delete</button>`;
    row.append(marker, copy, value, actions);
    list.append(row);
  }
}

function money(value) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0); }
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No date' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
