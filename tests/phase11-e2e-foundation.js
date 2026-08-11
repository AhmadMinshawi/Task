import assert from 'node:assert/strict';
import { createApp } from '../core/app.js';
import { createRepositories } from '../data/repositories/RepositoryFactory.js';
import { createMutationGuard } from '../core/MutationGuard.js';
import { createClientService } from '../domains/clients/ClientService.js';
import { createProjectService } from '../domains/projects/ProjectService.js';
import { createTaskService } from '../domains/tasks/TaskService.js';
import { createFinanceService } from '../domains/finance/FinanceService.js';
import { createExpenseService } from '../domains/expenses/ExpenseService.js';
import { createFinanceEngine } from '../domains/finance/FinanceEngine.js';

const app = createApp();
app.repositories = createRepositories(app);

app.managers.register('MutationGuard', createMutationGuard(app));
app.managers.register('FinanceEngine', createFinanceEngine());
app.managers.register('ClientService', createClientService(app));
app.managers.register('ProjectService', createProjectService(app));
app.managers.register('TaskService', createTaskService(app));
app.managers.register('FinanceService', createFinanceService(app));
app.managers.register('ExpenseService', createExpenseService(app));

assert.throws(
  () => app.managers.get('ClientService').create({ name: 'Blocked' }),
  /Authenticated owner required/
);

app.state.update(state => { state.session = { userId: 'e2e-user' }; });

const client = app.managers.get('ClientService').create({ name: 'E2E Client' });
const updatedClient = app.managers.get('ClientService').update(client.id, {
  name: 'E2E Client Updated',
  email: 'client@example.com',
  phone: '+201000000000',
  industry: 'Media'
});
assert.equal(updatedClient.name, 'E2E Client Updated');
assert.equal(updatedClient.email, 'client@example.com');
assert.equal(updatedClient.phone, '+201000000000');
assert.equal(updatedClient.industry, 'Media');
const project = app.managers.get('ProjectService').create({
  name: 'E2E Project',
  clientId: client.id,
  pricePerVideo: 500,
  totalVideos: 10,
  deadline: '2026-08-20'
});
assert.equal(String(project.deadline).slice(0, 10), '2026-08-20');
assert.equal(project.pinned, false);
assert.equal(project.status, 'new');
assert.equal(app.managers.get('ProjectService').update(project.id, { status: 'in_progress' }).status, 'in_progress');
assert.equal(app.managers.get('ProjectService').update(project.id, { status: 'ready' }).status, 'ready');
assert.equal(app.managers.get('ProjectService').update(project.id, { status: 'completed' }).status, 'completed');
assert.equal(app.managers.get('ProjectService').update(project.id, { status: 'in_progress' }).status, 'in_progress');
assert.throws(() => app.managers.get('ProjectService').update(project.id, { status: 'unknown' }), /Invalid project status/);
const pinnedProject = app.managers.get('ProjectService').update(project.id, { pinned: true });
assert.equal(pinnedProject.pinned, true);
const editedProject = app.managers.get('ProjectService').update(project.id, {
  name: 'E2E Project Updated',
  pricePerVideo: 600,
  totalVideos: 12,
  deadline: '2026-08-25'
});
assert.equal(editedProject.name, 'E2E Project Updated');
assert.equal(editedProject.pricePerVideo, 600);
assert.equal(editedProject.totalVideos, 12);
assert.equal(String(editedProject.deadline).slice(0, 10), '2026-08-25');

const task = app.managers.get('TaskService').create({
  title: 'E2E Task',
  projectId: project.id
});
const payment = app.managers.get('FinanceService').addPayment({
  projectId: project.id,
  amount: 2000
});
const delivery = app.managers.get('FinanceService').addDelivery({
  projectId: project.id,
  quantity: 1
});
const expense = app.managers.get('ExpenseService').create({
  title: 'Adobe',
  amount: 300
});

for (const [serviceName, record] of [['ClientService', updatedClient], ['ProjectService', pinnedProject], ['TaskService', task]]) {
  const service = app.managers.get(serviceName);
  assert.ok(service.archive(record.id).archivedAt);
  assert.equal(service.restore(record.id).archivedAt, null);
}
assert.ok(app.managers.get('FinanceService').archive('payment', payment.id).archivedAt);
assert.equal(app.managers.get('FinanceService').restore('payment', payment.id).archivedAt, null);
assert.ok(app.managers.get('FinanceService').archive('delivery', delivery.id).archivedAt);
assert.equal(app.managers.get('FinanceService').restore('delivery', delivery.id).archivedAt, null);
assert.ok(app.managers.get('ExpenseService').archive(expense.id).archivedAt);
assert.equal(app.managers.get('ExpenseService').restore(expense.id).archivedAt, null);
assert.equal(app.managers.get('TaskService').update(task.id, { status: 'done' }).status, 'done');
assert.equal(app.managers.get('TaskService').update(task.id, { status: 'todo' }).status, 'todo');
const quickTask = app.managers.get('TaskService').create({ title: 'Quick paid task', amount: 750, incomeDate: '2026-08-11' });
assert.equal(quickTask.projectId, null);
assert.equal(quickTask.amount, 750);
assert.equal(app.managers.get('TaskService').update(quickTask.id, { status: 'done' }).status, 'done');
const trashProject = app.managers.get('ProjectService').create({ name: 'Trash test' });
app.managers.get('ProjectService').remove(trashProject.id);
assert.ok(app.repositories.projects.findById(trashProject.id, { includeDeleted: true }).deletedAt);
assert.equal(app.managers.get('ProjectService').restoreDeleted(trashProject.id).deletedAt, null);
app.managers.get('ProjectService').remove(trashProject.id);
assert.equal(app.managers.get('ProjectService').emptyTrash(), 1);
assert.equal(app.repositories.projects.findById(trashProject.id, { includeDeleted: true }), null);
const purgeProject = app.managers.get('ProjectService').create({ name: 'Purge test' });
app.managers.get('ProjectService').remove(purgeProject.id);
app.managers.get('ProjectService').purgeDeleted(purgeProject.id);
assert.equal(app.repositories.projects.findById(purgeProject.id, { includeDeleted: true }), null);

const snapshot = app.state.snapshot();
const finance = app.managers.get('FinanceEngine');
const totals = finance.project(
  project,
  snapshot.payments.filter(x => x.projectId === project.id && !x.deletedAt),
  snapshot.deliveries.filter(x => x.projectId === project.id && !x.deletedAt)
);

assert.equal(totals.coveredVideos, 4);
assert.equal(totals.remainingPaidVideos, 3);
assert.equal(totals.remainingPaidValue, 1500);

assert.equal(snapshot.clients.length, 1);
assert.equal(snapshot.projects.length, 1);
assert.equal(snapshot.tasks.length, 2);
assert.equal(snapshot.payments.length, 1);
assert.equal(snapshot.deliveries.length, 1);
assert.equal(snapshot.expenses.length, 1);

for (const record of [
  snapshot.clients[0],
  snapshot.projects[0],
  snapshot.tasks[0],
  snapshot.payments[0],
  snapshot.deliveries[0],
  snapshot.expenses[0]
]) {
  assert.equal(record.ownerId, 'e2e-user');
}

console.log('Phase 11 E2E foundation runtime: PASS');
