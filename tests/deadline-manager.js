import assert from 'node:assert/strict';
import { createApp } from '../core/app.js';
import { createDeadlineManager, deadlineLabel } from '../services/DeadlineManager.js';

const app = createApp();
app.state.replace({
  projects: [
    { id: 'late-project', name: 'Late project', deadline: '2026-08-09', status: 'in_progress', archivedAt: null, deletedAt: null },
    { id: 'soon-project', name: 'Soon project', deadline: '2026-08-13', status: 'ready', archivedAt: null, deletedAt: null },
    { id: 'far-project', name: 'Far project', deadline: '2026-08-20', status: 'new', archivedAt: null, deletedAt: null },
    { id: 'done-project', name: 'Done project', deadline: '2026-08-10', status: 'completed', archivedAt: null, deletedAt: null }
  ],
  tasks: [
    { id: 'today-task', title: 'Today task', dueDate: '2026-08-11', status: 'todo', archivedAt: null, deletedAt: null },
    { id: 'done-task', title: 'Done task', dueDate: '2026-08-10', status: 'done', archivedAt: null, deletedAt: null },
    { id: 'archived-task', title: 'Archived task', dueDate: '2026-08-10', status: 'todo', archivedAt: '2026-08-01', deletedAt: null }
  ]
});

const manager = createDeadlineManager(app);
const alerts = manager.alerts(new Date('2026-08-11T12:00:00'));
assert.deepEqual(alerts.map(item => item.id), ['late-project', 'today-task', 'soon-project']);
assert.equal(alerts[0].urgency, 'overdue');
assert.equal(alerts[1].urgency, 'soon');
assert.equal(alerts[2].daysLeft, 2);
assert.equal(manager.count(new Date('2026-08-11T12:00:00')), 3);
assert.equal(deadlineLabel(alerts[0]), '2 days overdue');
assert.equal(deadlineLabel(alerts[1]), 'Due today');

console.log('Deadline manager: PASS');
