import { renderFinanceSummary } from './FinanceSummary.js';
import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';
import { renderFinanceReports } from './FinanceReports.js';
import { activeProjectIds } from '../../domains/projects/ProjectRelations.js';

export function renderFinanceView(root, app) {
  let financeHidden = true;
  let transactionsRoot = null;
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Money</span><h1>Finance</h1></div>
      <span class="dashboard-period" data-period></span>
    </div>
    <div data-finance-summary></div>
    <div data-finance-reports></div>
    <div class="finance-layout">
      <button class="dashboard-card finance-history-launch" type="button" data-open-transactions>
        <span><span class="eyebrow">Cash flow</span><strong>Recent transactions</strong><small>View payments, deliveries and expenses in one simple window.</small></span>
        <span class="secondary-action">View transactions</span>
      </button>
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
    renderFinanceReports(root.querySelector('[data-finance-reports]'), {
      months: app.managers.get('FinanceManager').monthlyTrend(6, month),
      clients: app.managers.get('FinanceManager').clientReports(),
      projects: app.managers.get('FinanceManager').projectReports()
    }, { hidden: financeHidden, onOpenProject: id => root.dispatchEvent(new CustomEvent('taskv:open-project', { bubbles: true, detail: { id } })) });
    if (transactionsRoot?.isConnected) renderLedger(transactionsRoot, state, financeHidden);
    else transactionsRoot = null;
  };

  const openTransactions = () => {
    const content = document.createElement('div');
    content.className = 'finance-transactions-modal';
    content.innerHTML = '<div class="modal-heading"><span class="eyebrow">Cash flow</span><h2>Recent transactions</h2><p>Read-only history. Manage a payment or delivery from its project.</p></div><div class="ledger-list" data-transactions-list></div>';
    transactionsRoot = content.querySelector('[data-transactions-list]');
    renderLedger(transactionsRoot, app.state.get(), financeHidden);
    app.modal.open(content, () => { transactionsRoot = null; });
  };

  renderExpenseQuickAdd(root.querySelector('[data-expense-add]'), data => {
    app.managers.get('ExpenseService').create(data);
  });
  refresh();
  const handleClick = event => {
    if (event.target.closest('[data-open-transactions]')) openTransactions();
  };
  root.addEventListener('click', handleClick);
  const unsubscribe = app.state.subscribe(refresh);
  return () => { unsubscribe(); root.removeEventListener('click', handleClick); };
}

function renderLedger(container, state, hidden) {
  const visible = item => !item.deletedAt && !item.archivedAt;
  const visibleProjects = activeProjectIds(state);
  const visibleFinance = item => visible(item) && visibleProjects.has(item.projectId);
  const projectName = id => state.projects.find(project => project.id === id)?.name || 'Workspace';
  const records = [
    ...state.payments.filter(visibleFinance).map(item => ({ ...item, kind: 'payment', label: 'Payment', value: item.amount, tone: 'positive', project: projectName(item.projectId) })),
    ...state.expenses.filter(visible).map(item => ({ ...item, kind: 'expense', label: 'Expense', value: -Number(item.amount), tone: 'negative', project: item.title || 'Expense' })),
    ...state.deliveries.filter(visibleFinance).map(item => ({ ...item, kind: 'delivery', label: 'Delivery', value: item.quantity, tone: 'neutral', project: projectName(item.projectId) }))
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
    row.className = 'ledger-row is-read-only';
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
