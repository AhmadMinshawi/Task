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

  function updatePayment(id, { amount, title = 'Payment', date = '' }) {
    guard.assertManager('FinanceService');
    const current = app.repositories.payments.findById(id);
    if (!current) throw new Error('Payment not found');
    return app.repositories.payments.update(id, {
      amount: normalizeMoney(amount),
      title: String(title).trim() || 'Payment',
      date: normalizeOptionalDate(date) ?? current.date,
      updatedAt: new Date().toISOString()
    });
  }

  function updateDelivery(id, { quantity, title = 'Delivery', date = '' }) {
    guard.assertManager('FinanceService');
    const current = app.repositories.deliveries.findById(id);
    if (!current) throw new Error('Delivery not found');
    const nextQuantity = normalizeQuantity(quantity);
    if (nextQuantity < 1) throw new Error('Delivery quantity must be at least 1');
    return app.repositories.deliveries.update(id, {
      quantity: nextQuantity,
      title: String(title).trim() || 'Delivery',
      date: normalizeOptionalDate(date) ?? current.date,
      updatedAt: new Date().toISOString()
    });
  }

  function mutate(kind, id, action) {
    guard.assertManager('FinanceService');
    const repository = kind === 'payment' ? app.repositories.payments : app.repositories.deliveries;
    if (!repository) throw new Error('Invalid finance record type');
    if (action === 'delete') return repository.softDelete(id);
    return repository.update(id, {
      archivedAt: action === 'archive' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    });
  }

  return Object.freeze({
    addPayment,
    addDelivery,
    updatePayment,
    updateDelivery,
    archive: (kind, id) => mutate(kind, id, 'archive'),
    restore: (kind, id) => mutate(kind, id, 'restore'),
    remove: (kind, id) => mutate(kind, id, 'delete')
  });
}
