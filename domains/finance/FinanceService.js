import { recordMeta, normalizeMoney, normalizeQuantity, normalizeOptionalDate } from '../../core/record.js';
import { assertPaymentAllowed, assertDeliveryAllowed } from '../projects/ProjectIntegrity.js';

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
    const project = assertProject(projectId);
    const safeAmount = normalizeMoney(amount);
    assertPaymentAllowed(app.state.get(), project, safeAmount);
    const record = {
      id: crypto.randomUUID(),
      ...recordMeta(app),
      projectId,
      amount: safeAmount,
      title: String(title).trim() || 'Payment',
      date: normalizeOptionalDate(date) ?? new Date().toISOString()
    };
    app.repositories.payments.insert(record);
    app.events.emit('payment.created', record);
    return record;
  }

  function addDelivery({ projectId, quantity, title = 'Delivery', date = '' }) {
    guard.assertManager('FinanceService');
    const project = assertProject(projectId);
    const safeQuantity = normalizeQuantity(quantity);
    assertDeliveryAllowed(app.state.get(), project, safeQuantity);
    const record = {
      id: crypto.randomUUID(),
      ...recordMeta(app),
      projectId,
      quantity: safeQuantity,
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
    const nextAmount = normalizeMoney(amount);
    assertPaymentAllowed(app.state.get(), assertProject(current.projectId), nextAmount, id);
    return app.repositories.payments.update(id, {
      amount: nextAmount,
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
    assertDeliveryAllowed(app.state.get(), assertProject(current.projectId), nextQuantity, id);
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
    const record = repository.findById(id);
    if (!record) throw new Error('Finance record not found');
    const project = assertProject(record.projectId);
    if (action === 'restore') {
      if (kind === 'payment') assertPaymentAllowed(app.state.get(), project, Number(record.amount), id);
      else assertDeliveryAllowed(app.state.get(), project, Number(record.quantity), id);
    }
    if (kind === 'delivery' && (action === 'archive' || action === 'delete') && project.status === 'completed') {
      throw new Error('Change the project status before removing a delivery from a completed project');
    }
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
