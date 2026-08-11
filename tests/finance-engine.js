import assert from 'node:assert/strict';
import { createApp } from '../core/app.js';
import { createFinanceEngine } from '../domains/finance/FinanceEngine.js';
import { createFinanceManager } from '../domains/finance/FinanceManager.js';

const app = createApp();
app.managers.register('FinanceEngine', createFinanceEngine());
app.managers.register('FinanceManager', createFinanceManager(app));

const project = {
  id: 'project-test-1',
  ownerId: 'user-test-1',
  name: 'Example',
  pricePerVideo: 500,
  totalVideos: 10,
  deletedAt: null
};

app.state.update(s => {
  s.session = { userId: 'user-test-1' };
  s.projects.push(project);
  s.payments.push({ id: 'p1', projectId: project.id, amount: 2000, deletedAt: null });
  s.deliveries.push({ id: 'd1', projectId: project.id, quantity: 1, deletedAt: null });
  s.tasks.push({ id: 'quick-1', projectId: null, title: 'Quick edit', amount: 700, status: 'done', incomeDate: '2026-08-11', deletedAt: null, archivedAt: null });
});

const result = app.managers.get('FinanceManager').projectSummary(project.id);

assert.equal(result.paid, 2000);
assert.equal(result.deliveredVideos, 1);
assert.equal(result.coveredVideos, 4);
assert.equal(result.remainingPaidVideos, 3);
assert.equal(result.remainingPaidValue, 1500);

const portfolio = app.managers.get('FinanceManager').portfolioSummary('2026-08');
assert.equal(portfolio.projectValue, 5000);
assert.equal(portfolio.allTimeCollected, 2000);
assert.equal(portfolio.outstanding, 3000);
assert.equal(portfolio.taskIncome, 700);
assert.equal(portfolio.collected, 700);

console.log('Finance foundation runtime test: PASS');
