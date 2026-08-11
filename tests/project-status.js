import assert from 'node:assert/strict';
import { displayProjectStatus, normalizeProjectStatus, projectStatusLabel } from '../domains/projects/ProjectStatus.js';

assert.equal(normalizeProjectStatus('progress'), 'in_progress');
assert.equal(normalizeProjectStatus('done'), 'completed');
assert.throws(() => normalizeProjectStatus('invalid'), /Invalid project status/);
assert.equal(displayProjectStatus({ status: 'in_progress', deadline: '2026-01-01' }, new Date('2026-01-02T12:00:00')), 'overdue');
assert.equal(displayProjectStatus({ status: 'completed', deadline: '2026-01-01' }, new Date('2026-01-02T12:00:00')), 'completed');
assert.equal(displayProjectStatus({ status: 'unknown-legacy-value' }), 'new');
assert.equal(projectStatusLabel('ready'), 'Ready to deliver');

console.log('Project lifecycle status: PASS');
