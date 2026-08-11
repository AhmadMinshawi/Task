import assert from 'node:assert/strict';
import { createApp } from '../core/app.js';
import { createPersistenceManager } from '../data/persistence/PersistenceManager.js';

const app = createApp();
let saved = null;
let saves = 0;
const repository = {
  async load(userId) {
    return { session: { userId }, projects: [{ id: 'p1', ownerId: userId, name: 'Deleted', deletedAt: '2026-08-11T00:00:00Z' }] };
  },
  async save(state) { saved = structuredClone(state); saves += 1; },
  currentRevision() { return saves; }
};

const persistence = createPersistenceManager(app, repository);
persistence.watch();
await persistence.load('user-1');
assert.equal(saves, 0, 'loading remote state must not immediately save it back');

app.state.update(state => { state.projects[0].deletedAt = null; });
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(saves, 1, 'every state mutation after load must be persisted');
assert.equal(saved.projects[0].deletedAt, null, 'restored deletion state must reach persistence');

persistence.stop();
app.state.update(state => { state.projects[0].name = 'No save after stop'; });
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(saves, 1, 'stop must remove the state watcher');

console.log('Persistence state watch: PASS');
