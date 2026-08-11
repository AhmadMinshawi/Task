export function renderFinanceSummary(root, data, { showOutstanding = false } = {}) {
  root.innerHTML = `
    <section class="finance-summary">
      <div class="summary-header">
        <div>
          <span class="eyebrow">Monthly finance</span>
          <h2>Financial Summary</h2>
        </div>
        <button type="button" class="icon-button" data-toggle-outstanding aria-label="Show outstanding">◉</button>
      </div>

      <div class="summary-grid">
        <article><span>Collected</span><strong>${formatMoney(data.collected)}</strong></article>
        <article><span>Expenses</span><strong>${formatMoney(data.expenses)}</strong></article>
        <article><span>Net after expenses</span><strong>${formatMoney(data.netCollected)}</strong></article>
      </div>

      <div class="outstanding ${showOutstanding ? 'is-visible' : ''}" data-outstanding>
        <span>Outstanding receivables</span>
        <strong>${formatMoney(data.outstanding ?? 0)}</strong>
      </div>
    </section>
  `;

  const button = root.querySelector('[data-toggle-outstanding]');
  const outstanding = root.querySelector('[data-outstanding]');
  button.addEventListener('click', () => outstanding.classList.toggle('is-visible'));
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}
