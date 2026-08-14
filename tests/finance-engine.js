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
  deletedAt: null,
  archivedAt: null
};

app.state.update(state => {
  state.session = { userId: 'user-test-1' };
  state.projects.push(project);
  state.payments.push({ id: 'p1', projectId: project.id, amount: 2000, date: '2026-08-11', deletedAt: null, archivedAt: null });
  state.deliveries.push({ id: 'd1', projectId: project.id, quantity: 1, date: '2026-08-11', deletedAt: null, archivedAt: null });
  state.tasks.push({ id: 'quick-1', projectId: null, title: 'Quick edit', amount: 700, status: 'done', incomeDate: '2026-08-11', deletedAt: null, archivedAt: null });
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
assert.equal(portfolio.collected, 2000);
assert.equal(portfolio.expenses, 0);
assert.equal(portfolio.net, 2000);
assert.equal('taskIncome' in portfolio, false);

console.log('Finance V1.0.0 runtime test: PASS');
