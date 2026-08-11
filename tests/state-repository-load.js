import assert from 'node:assert/strict';
import { createStateRepository } from '../data/persistence/StateRepository.js';

const stored = { payload: { state: { projects: [{ id: 'p1' }] } }, revision: 3 };
const query = {
  select() { return this; },
  eq() { return this; },
  async maybeSingle() { return { data: stored, error: null }; }
};
const supabase = { from() { return query; } };
const repository = createStateRepository(supabase);
const state = await repository.load('user-1');

assert.equal(state.session.userId, 'user-1');
assert.equal(state.projects.length, 1);
for (const collection of ['clients','tasks','payments','deliveries','expenses','activities']) {
  assert.deepEqual(state[collection], [], `${collection} must default to an empty array`);
}

console.log('State repository load normalization: PASS');
