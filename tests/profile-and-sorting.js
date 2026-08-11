import assert from 'node:assert/strict';
import { sortRecords } from '../ui/utils/sortRecords.js';
import { normalizeOptionalUrl } from '../core/url.js';
import { createApp } from '../core/app.js';
import { createAuthManager } from '../security/AuthManager.js';

const records = [
  { id: 'b', name: 'Beta', createdAt: '2026-01-02T00:00:00Z' },
  { id: 'a', name: 'Alpha', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'p', name: 'Pinned', createdAt: '2025-01-01T00:00:00Z', pinned: true }
];
assert.deepEqual(sortRecords(records, 'name').map(item => item.id), ['a', 'b', 'p']);
assert.deepEqual(sortRecords(records, 'oldest').map(item => item.id), ['p', 'a', 'b']);
assert.deepEqual(sortRecords(records, 'newest', { pinned: true }).map(item => item.id), ['p', 'b', 'a']);
assert.equal(normalizeOptionalUrl('https://example.com/work'), 'https://example.com/work');
assert.throws(() => normalizeOptionalUrl('javascript:alert(1)'), /Invalid link/);

const updates = [];
const supabase = {
  auth: {
    async updateUser(attributes) {
      updates.push(attributes);
      return {
        data: { user: { id: 'user-1', email: attributes.email || 'old@example.com', user_metadata: { name: attributes.data?.name || 'New name' } } },
        error: null
      };
    }
  }
};
const app = createApp();
const auth = createAuthManager(app, supabase);
await auth.applySession({ user: { id: 'user-1', email: 'old@example.com', user_metadata: { name: 'Old name' } } });
await auth.updateProfile({ name: 'New name', email: 'new@example.com' });
assert.equal(auth.user().name, 'New name');
assert.equal(auth.user().email, 'new@example.com');
await auth.updatePassword('old-password', 'new-password');
assert.deepEqual(updates[1], { current_password: 'old-password', password: 'new-password' });

console.log('Profile and sorting: PASS');
