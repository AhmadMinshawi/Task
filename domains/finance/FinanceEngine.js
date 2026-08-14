import { Validators } from '../../core/validators.js';

export function createFinanceEngine() {
  function project(project, payments = [], deliveries = []) {
    const price = Validators.money(project.pricePerVideo, 'pricePerVideo');
    const totalVideos = Validators.quantity(project.totalVideos, 'totalVideos');
    const paid = payments.reduce((s, p) => s + Validators.money(p.amount), 0);
    const delivered = deliveries.reduce((s, d) => s + Validators.quantity(d.quantity), 0);

    const hasFixedTotal = totalVideos > 0;
    const coveredVideos = price > 0 ? Math.floor(paid / price) : 0;
    const consumedValue = delivered * price;
    const remainingPaidValue = Math.max(paid - consumedValue, 0);
    const remainingPaidVideos = price > 0 ? Math.floor(remainingPaidValue / price) : 0;
    const remainingProjectVideos = hasFixedTotal ? Math.max(totalVideos - delivered, 0) : remainingPaidVideos;
    const grossProjectValue = hasFixedTotal ? price * totalVideos : 0;
    const outstandingAmount = hasFixedTotal ? Math.max(grossProjectValue - paid, 0) : 0;

    return Object.freeze({
      hasFixedTotal,
      grossProjectValue,
      paid,
      deliveredVideos: delivered,
      consumedValue,
      coveredVideos,
      remainingPaidVideos,
      remainingPaidValue,
      remainingProjectVideos,
      outstandingAmount
    });
  }

  function monthly(payments = [], expenses = [], month) {
    const inMonth = item => String(item.date ?? item.createdAt ?? '').slice(0, 7) === month;
    const paymentIncome = payments.filter(inMonth).reduce((s, p) => s + Validators.money(p.amount), 0);
    const taskIncome = 0;
    const collected = paymentIncome;
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
