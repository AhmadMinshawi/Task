import { Validators } from '../../core/validators.js';

export function createFinanceEngine() {
  function project(project, payments = [], deliveries = []) {
    const price = Validators.money(project.pricePerVideo, 'pricePerVideo');
    const totalVideos = Validators.quantity(project.totalVideos, 'totalVideos');
    const paid = payments.reduce((s, p) => s + Validators.money(p.amount), 0);
    const delivered = deliveries.reduce((s, d) => s + Validators.quantity(d.quantity), 0);

    const coveredVideos = price > 0 ? Math.floor(paid / price) : 0;
    const remainingPaidVideos = Math.max(coveredVideos - delivered, 0);
    const remainingPaidValue = remainingPaidVideos * price;
    const remainingProjectVideos = Math.max(totalVideos - delivered, 0);

    return Object.freeze({
      grossProjectValue: price * totalVideos,
      paid,
      deliveredVideos: delivered,
      coveredVideos,
      remainingPaidVideos,
      remainingPaidValue,
      remainingProjectVideos
    });
  }

  function monthly(payments = [], expenses = [], month, quickTasks = []) {
    const inMonth = item => String(item.date ?? item.createdAt ?? '').slice(0, 7) === month;
    const paymentIncome = payments.filter(inMonth).reduce((s, p) => s + Validators.money(p.amount), 0);
    const taskIncome = quickTasks
      .filter(task => task.status === 'done' && inMonth({ ...task, date: task.incomeDate || task.dueDate || task.updatedAt }))
      .reduce((sum, task) => sum + Validators.money(task.amount), 0);
    const collected = paymentIncome + taskIncome;
    const spent = expenses.filter(inMonth).reduce((s, e) => s + Validators.money(e.amount), 0);

    return Object.freeze({
      month,
      collected,
      expenses: spent,
      paymentIncome,
      taskIncome,
      netCollected: collected - spent
    });
  }

  function outstanding(receivables = []) {
    return receivables.reduce((s, item) => s + Validators.money(item.amount), 0);
  }

  return Object.freeze({ project, monthly, outstanding });
}
