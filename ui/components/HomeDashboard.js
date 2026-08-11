import { renderFinanceSummary } from './FinanceSummary.js';
import { renderExpenseQuickAdd } from './ExpenseQuickAdd.js';

export function renderHomeDashboard(root, app) {
  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Overview</span><h1>Home</h1></div>
    </div>
    <div data-finance-summary></div>
    <div class="home-columns">
      <div data-expense-add></div>
      <div class="placeholder-card">
        <span class="eyebrow">Workspace</span>
        <h3>Projects & activity</h3>
        <p>The same data core will feed the next modules.</p>
      </div>
    </div>
  `;

  const refresh = () => {
    const month = new Date().toISOString().slice(0, 7);
    const summary = app.managers.get('FinanceManager').monthlySummary(month);
    renderFinanceSummary(root.querySelector('[data-finance-summary]'), summary);
  };

  refresh();

  renderExpenseQuickAdd(root.querySelector('[data-expense-add]'), async data => {
    app.managers.get('ExpenseService').create(data);
    refresh();
  });

  const unsubscribe = app.state.subscribe(refresh);
  return () => unsubscribe();
}
