export function renderFinanceSummary(root, data, { hidden = false, onToggle = () => {} } = {}) {
  const value = amount => hidden ? '•••••' : formatMoney(amount);
  root.innerHTML = `
    <section class="finance-summary">
      <div class="summary-header">
        <div>
          <span class="eyebrow">Monthly finance</span>
          <h2>Financial Summary</h2>
        </div>
        <button type="button" class="icon-button" data-toggle-finance aria-label="${hidden ? 'Show' : 'Hide'} financial values" aria-pressed="${!hidden}">${hidden ? '◉' : '◎'}</button>
      </div>

      <div class="summary-grid">
        <article><span>Collected this month</span><strong>${value(data.collected)}</strong></article>
        <article><span>Expenses this month</span><strong>${value(data.expenses)}</strong></article>
        <article><span>Net after expenses</span><strong>${value(data.netCollected)}</strong></article>
      </div>

      <div class="outstanding is-visible">
        <span>Outstanding receivables</span>
        <strong>${value(data.outstanding ?? 0)}</strong>
      </div>
    </section>
  `;

  root.querySelector('[data-toggle-finance]').addEventListener('click', onToggle);
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}
