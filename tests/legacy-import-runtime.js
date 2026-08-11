import assert from 'node:assert/strict';
import { importLegacyJobs } from '../data/persistence/LegacyImporter.js';

const result = importLegacyJobs('user-a', [{
  id: 'job-1', client: 'Omar', pricePerVideo: 500, totalVideos: 10,
  payments: [{amount: 2000, createdAt: 1780000000000}],
  delivered: [{count: 1, createdAt: 1780000000100}],
  taskList: [{id:'t1', text:'Edit', done:false}], expenses: []
}]);
assert.equal(result.clients.length, 1);
assert.equal(result.projects.length, 1);
assert.equal(result.payments[0].amount, 2000);
assert.equal(result.deliveries[0].quantity, 1);
assert.equal(result.tasks[0].projectId, 'job-1');
assert.equal(result.projects[0].status, 'new');
console.log('Legacy import runtime: PASS');
