import assert from 'node:assert/strict';
import { createApp } from '../core/app.js';
import { createRepositories } from '../data/repositories/RepositoryFactory.js';
import { createMutationGuard } from '../core/MutationGuard.js';
import { createClientService } from '../domains/clients/ClientService.js';
import { createProjectService } from '../domains/projects/ProjectService.js';
import { createProjectNoteService } from '../domains/projects/ProjectNoteService.js';
import { createFinanceService } from '../domains/finance/FinanceService.js';
import { createFinanceEngine } from '../domains/finance/FinanceEngine.js';

const app = createApp();
app.repositories = createRepositories(app);
app.managers.register('MutationGuard', createMutationGuard(app));
app.managers.register('FinanceEngine', createFinanceEngine());
app.managers.register('ClientService', createClientService(app));
app.managers.register('ProjectService', createProjectService(app));
app.managers.register('ProjectNoteService', createProjectNoteService(app));
app.managers.register('FinanceService', createFinanceService(app));
app.state.update(state => { state.session = { userId: 'v1-user' }; });

const client = app.managers.get('ClientService').create({ name: 'V1 Client' });
const project = app.managers.get('ProjectService').create({
  name: 'V1 Project',
  clientId: client.id,
  projectType: 'quick',
  pricePerVideo: 500,
  totalVideos: 4,
  deadline: '2026-08-20'
});

assert.throws(() => app.managers.get('ProjectService').update(project.id, { status: 'completed' }), /Record all video deliveries/);
app.managers.get('FinanceService').addPayment({ projectId: project.id, amount: 2000, date: '2026-08-14' });
app.managers.get('FinanceService').addDelivery({ projectId: project.id, quantity: 4, date: '2026-08-14' });
assert.equal(app.managers.get('ProjectService').update(project.id, { status: 'completed' }).status, 'completed');

const note = app.managers.get('ProjectNoteService').create(project.id, { date: '2026-08-15', text: 'Send final files' });
assert.equal(note.text, 'Send final files');
assert.equal(app.state.get().projects.find(item => item.id === project.id).notes.length, 1);

const finance = app.managers.get('FinanceEngine').project(
  app.state.get().projects.find(item => item.id === project.id),
  app.state.get().payments,
  app.state.get().deliveries
);
assert.equal(finance.paid, 2000);
assert.equal(finance.deliveredVideos, 4);
assert.equal(finance.remainingProjectVideos, 0);
assert.equal(finance.outstandingAmount, 0);

console.log('Phase 12 V1.0.0 runtime: PASS');
