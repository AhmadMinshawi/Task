import { recordMeta, normalizeMoney, normalizeQuantity, normalizeOptionalDate } from '../../core/record.js';

export function createFinanceService(app) {
  const guard = app.managers.get('MutationGuard');
  function assertProject(projectId) {
    if (!projectId) throw new Error('Project is required');
    const project = app.repositories.projects.findById(projectId);
    if (!project) throw new Error('Project not found');
    return project;
  }

  function addPayment({ projectId, amount, title = 'Payment', date = '' }) {
    guard.assertManager('FinanceService');
    assertProject(projectId);
    const record = {
      id: crypto.randomUUID(),
      ...recordMeta(app),
      projectId,
      amount: normalizeMoney(amount),
      title: String(title).trim() || 'Payment',
      date: normalizeOptionalDate(date) ?? new Date().toISOString()
    };
    app.repositories.payments.insert(record);
    app.events.emit('payment.created', record);
    return record;
  }

  function addDelivery({ projectId, quantity, title = 'Delivery', date = '' }) {
    guard.assertManager('FinanceService');
    assertProject(projectId);
    const record = {
      id: crypto.randomUUID(),
      ...recordMeta(app),
      projectId,
      quantity: normalizeQuantity(quantity),
      title: String(title).trim() || 'Delivery',
      date: normalizeOptionalDate(date) ?? new Date().toISOString()
    };
    if (record.quantity < 1) throw new Error('Delivery quantity must be at least 1');
    app.repositories.deliveries.insert(record);
    app.events.emit('delivery.created', record);
    return record;
  }

  return Object.freeze({ addPayment, addDelivery });
}
