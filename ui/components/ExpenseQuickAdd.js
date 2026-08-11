export function renderExpenseQuickAdd(root, onSubmit) {
  root.innerHTML = `
    <form class="quick-add" novalidate>
      <div class="quick-add-title">
        <strong>Add expense</strong>
        <span>Keep it simple. Date is optional.</span>
      </div>
      <label>Amount<input name="amount" inputmode="decimal" type="number" min="0.01" step="0.01" required></label>
      <label>What was it for?<input name="title" type="text" maxlength="120" placeholder="Adobe, maintenance, internet…" required></label>
      <label>Date <span class="optional">(optional)</span><input name="date" type="date"></label>
      <button type="submit">Add expense</button>
      <p class="form-error" aria-live="polite"></p>
    </form>
  `;

  const form = root.querySelector('form');
  const error = root.querySelector('.form-error');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      await onSubmit(data);
      form.reset();
    } catch (err) {
      error.textContent = err.message || 'Could not add expense.';
    }
  });
}
