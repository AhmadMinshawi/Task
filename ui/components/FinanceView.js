import { renderFinanceSummary } from './FinanceSummary.js';
import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';

export function renderFinanceView(root, app) {
  let financeHidden = true;
  let mode = 'active';
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Money</span><h1>Finance</h1></div>
      <span class="dashboard-period" data-period></span>
    </div>
    <div data-finance-summary></div>
    <div class="finance-layout">
      <section class="dashboard-card finance-ledger">
        <div class="dashboard-card-head"><div><span class="eyebrow">Cash flow</span><h2>Recent transactions</h2></div></div>
        <div class="ledger-list" data-ledger></div>
      </section>
      <div data-expense-add></div>
    </div>
  `;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  root.querySelector('[data-period]').textContent = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date());

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
    renderLedger(root.querySelector('[data-ledger]'), state, financeHidden, mode);
  };

  renderExpenseQuickAdd(root.querySelector('[data-expense-add]'), data => {
    app.managers.get('ExpenseService').create(data);
  });
  refresh();
  const handleClick = event => {
    const modeButton = event.target.closest('[data-finance-mode]');
    if (modeButton) {
      mode = modeButton.dataset.financeMode;
      root.querySelectorAll('[data-finance-mode]').forEach(button => button.classList.toggle('is-active', button === modeButton));
      root.querySelector('[data-expense-add]').hidden = mode === 'archive';
      refresh();
      return;
    }
    const action = event.target.closest('[data-archive-record],[data-restore-record],[data-delete-record]');
    if (!action) return;
    const kind = action.dataset.kind;
    const id = action.dataset.archiveRecord || action.dataset.restoreRecord || action.dataset.deleteRecord;
    const service = kind === 'expense' ? app.managers.get('ExpenseService') : app.managers.get('FinanceService');
    if (action.matches('[data-archive-record]')) kind === 'expense' ? service.archive(id) : service.archive(kind, id);
    else if (action.matches('[data-restore-record]')) kind === 'expense' ? service.restore(id) : service.restore(kind, id);
    else confirmFinanceDelete(app, kind, () => kind === 'expense' ? service.remove(id) : service.remove(kind, id));
  };
  root.addEventListener('click', handleClick);
  const unsubscribe = app.state.subscribe(refresh);
  return () => { unsubscribe(); root.removeEventListener('click', handleClick); };
}

function renderLedger(container, state, hidden, mode) {
  const visible = item => !item.deletedAt && (mode === 'archive' ? item.archivedAt : !item.archivedAt);
  const projectName = id => state.projects.find(project => project.id === id)?.name || 'Workspace';
  const records = [
    ...state.payments.filter(visible).map(item => ({ ...item, kind: 'payment', label: 'Payment', value: item.amount, tone: 'positive', project: projectName(item.projectId) })),
    ...state.expenses.filter(visible).map(item => ({ ...item, kind: 'expense', label: 'Expense', value: -Number(item.amount), tone: 'negative', project: item.title || 'Expense' })),
    ...state.deliveries.filter(visible).map(item => ({ ...item, kind: 'delivery', label: 'Delivery', value: item.quantity, tone: 'neutral', project: projectName(item.projectId) }))
  ].sort((a, b) => recordDate(b).localeCompare(recordDate(a))).slice(0, 20);

  container.replaceChildren();
  if (!records.length) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = 'Payments, expenses and deliveries will appear here.';
    container.append(empty);
    return;
  }

  for (const record of records) {
    const row = document.createElement('article');
    row.className = 'ledger-row';
    const badge = document.createElement('span');
    badge.className = `ledger-badge ${record.tone}`;
    badge.textContent = record.label.slice(0, 1);
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = record.kind === 'expense' ? record.title : record.project;
    const meta = document.createElement('small');
    meta.textContent = `${record.label} · ${formatDate(recordDate(record))}`;
    copy.append(title, meta);
    const amount = document.createElement('strong');
    amount.className = `ledger-value ${record.tone}`;
    amount.textContent = hidden ? '•••••' : record.kind === 'delivery' ? `${record.value} videos` : money(record.value);
    const actions = document.createElement('div');
    actions.className = 'ledger-actions';
    const primary = document.createElement('button');
    primary.type = 'button';
    primary.className = 'row-action';
    primary.dataset.kind = record.kind;
    if (mode === 'archive') { primary.dataset.restoreRecord = record.id; primary.textContent = 'Restore'; }
    else { primary.dataset.archiveRecord = record.id; primary.textContent = 'Archive'; }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'row-action danger-action';
    remove.dataset.kind = record.kind;
    remove.dataset.deleteRecord = record.id;
    remove.textContent = 'Delete';
    actions.append(primary, remove);
    row.append(badge, copy, amount, actions);
    container.append(row);
  }
}

function confirmFinanceDelete(app, kind, onConfirm) {
  const content = document.createElement('div');
  content.innerHTML = `<div class="modal-heading"><span class="eyebrow">Delete record</span><h2>Delete this ${kind}?</h2><p>The record will be removed from both the active ledger and its archive.</p></div><div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action danger-button" type="button" data-confirm>Delete</button></div>`;
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  content.querySelector('[data-confirm]').addEventListener('click', () => { onConfirm(); app.modal.close(); });
  app.modal.open(content);
}

function recordDate(item) {
  return String(item.date || item.createdAt || '');
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function money(value) {
  const amount = Number(value) || 0;
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Math.abs(amount));
  return `${amount < 0 ? '−' : '+'}${formatted}`;
}
