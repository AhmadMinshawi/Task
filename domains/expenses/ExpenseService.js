import { Validators } from '../../core/validators.js';

export function createExpenseService(app) {
  const guard = app.managers.get('MutationGuard');
  return Object.freeze({
    create({ amount, title, date, ownerId }) {
      guard.assertManager('ExpenseService');
      Validators.positiveMoney(amount);
      Validators.required(title, 'title');
      const safeDate = Validators.date(date) ?? new Date().toISOString().slice(0, 10);

      const expense = {
        id: crypto.randomUUID(),
        ownerId: ownerId ?? app.state.get().session?.userId ?? null,
        amount: Number(amount),
        title: String(title).trim(),
        date: safeDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };

      app.repositories.expenses.insert(expense);
      app.events.emit('expense.created', expense);
      return expense;
    }
  });
}
