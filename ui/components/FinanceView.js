import { renderFinanceSummary } from './FinanceSummary.js';
import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';

export function renderFinanceView(root, app) {
  let financeHidden = false;
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

  const month = new Date().toISOString().slice(0, 7);
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
    renderLedger(root.querySelector('[data-ledger]'), state, financeHidden);
  };

  renderExpenseQuickAdd(root.querySelector('[data-expense-add]'), data => {
    app.managers.get('ExpenseService').create(data);
  });
  refresh();
  const unsubscribe = app.state.subscribe(refresh);
  return () => unsubscribe();
}

function renderLedger(container, state, hidden) {
  const projectName = id => state.projects.find(project => project.id === id)?.name || 'Workspace';
  const records = [
    ...state.payments.filter(x => !x.deletedAt).map(item => ({ ...item, kind: 'Payment', value: item.amount, tone: 'positive', project: projectName(item.projectId) })),
    ...state.expenses.filter(x => !x.deletedAt).map(item => ({ ...item, kind: 'Expense', value: -Number(item.amount), tone: 'negative', project: item.title || 'Expense' })),
    ...state.deliveries.filter(x => !x.deletedAt).map(item => ({ ...item, kind: 'Delivery', value: item.quantity, tone: 'neutral', project: projectName(item.projectId) }))
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
    badge.textContent = record.kind.slice(0, 1);
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = record.kind === 'Expense' ? record.title : record.project;
    const meta = document.createElement('small');
    meta.textContent = `${record.kind} · ${formatDate(recordDate(record))}`;
    copy.append(title, meta);
    const amount = document.createElement('strong');
    amount.className = `ledger-value ${record.tone}`;
    amount.textContent = hidden ? '•••••' : record.kind === 'Delivery' ? `${record.value} videos` : money(record.value);
    row.append(badge, copy, amount);
    container.append(row);
  }
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
