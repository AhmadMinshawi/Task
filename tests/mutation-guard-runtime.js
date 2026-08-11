import assert from 'node:assert/strict';
import { createApp } from '../core/app.js';
import { createRepositories } from '../data/repositories/RepositoryFactory.js';
import { createMutationGuard } from '../core/MutationGuard.js';
import { createClientService } from '../domains/clients/ClientService.js';
import { createProjectService } from '../domains/projects/ProjectService.js';
import { createTaskService } from '../domains/tasks/TaskService.js';
import { createFinanceService } from '../domains/finance/FinanceService.js';
import { createExpenseService } from '../domains/expenses/ExpenseService.js';

const app = createApp();
app.repositories = createRepositories(app);

app.managers.register('MutationGuard', createMutationGuard(app));
app.managers.register('ClientService', createClientService(app));
app.managers.register('ProjectService', createProjectService(app));
app.managers.register('TaskService', createTaskService(app));
app.managers.register('FinanceService', createFinanceService(app));
app.managers.register('ExpenseService', createExpenseService(app));

assert.throws(
  () => app.managers.get('ClientService').create({ name: 'Blocked' }),
  /Authenticated owner required/,
  'mutations must fail closed before login'
);

app.state.update(state => {
  state.session = { userId: 'user-a' };
});

const client = app.managers.get('ClientService').create({ name: 'Client A' });
assert.equal(client.ownerId, 'user-a');

const project = app.managers.get('ProjectService').create({
  name: 'Project A',
  clientId: client.id,
  pricePerVideo: 500,
  totalVideos: 10
});
assert.equal(project.ownerId, 'user-a');

const task = app.managers.get('TaskService').create({
  title: 'Task A',
  projectId: project.id
});
assert.equal(task.ownerId, 'user-a');

const payment = app.managers.get('FinanceService').addPayment({
  projectId: project.id,
  amount: 2000
});
assert.equal(payment.ownerId, 'user-a');

const delivery = app.managers.get('FinanceService').addDelivery({
  projectId: project.id,
  quantity: 1
});
assert.equal(delivery.ownerId, 'user-a');
const updatedPayment = app.managers.get('FinanceService').updatePayment(payment.id, { amount: 2500, title: 'Second installment', date: '' });
assert.equal(updatedPayment.amount, 2500);
assert.equal(updatedPayment.title, 'Second installment');
const updatedDelivery = app.managers.get('FinanceService').updateDelivery(delivery.id, { quantity: 2, title: 'First batch', date: '' });
assert.equal(updatedDelivery.quantity, 2);
assert.equal(updatedDelivery.title, 'First batch');
assert.throws(() => app.managers.get('FinanceService').updateDelivery(delivery.id, { quantity: 0 }), /at least 1/);

const expense = app.managers.get('ExpenseService').create({
  amount: 300,
  title: 'Adobe'
});
assert.equal(expense.ownerId, 'user-a');

assert.throws(
  () => app.managers.get('MutationGuard').assertManager('UnknownService'),
  /Mutation not allowed/,
  'unknown mutation owners must be rejected'
);

console.log('MutationGuard + service integration runtime test: PASS');
