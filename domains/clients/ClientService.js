import { recordMeta } from '../../core/record.js';
import { normalizeOptionalUrl } from '../../core/url.js';

export function createClientService(app) {
  const guard = app.managers.get('MutationGuard');
  function create({ name, email = '', phone = '', industry = '', profileLink = '' }) {
    guard.assertManager('ClientService');
    if (!String(name ?? '').trim()) throw new Error('Client name is required');

    const record = {
      id: crypto.randomUUID(),
      ...recordMeta(app),
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      industry: String(industry).trim(),
      profileLink: normalizeOptionalUrl(profileLink, 'profile link')
    };

    app.repositories.clients.insert(record);
    app.events.emit('client.created', record);
    return record;
  }

  function update(id, patch) {
    guard.assertManager('ClientService');
    const safe = {};
    if (patch.name !== undefined) {
      if (!String(patch.name).trim()) throw new Error('Client name is required');
      safe.name = String(patch.name).trim();
    }
    if (patch.email !== undefined) safe.email = String(patch.email).trim();
    if (patch.phone !== undefined) safe.phone = String(patch.phone).trim();
    if (patch.industry !== undefined) safe.industry = String(patch.industry).trim();
    if (patch.profileLink !== undefined) safe.profileLink = normalizeOptionalUrl(patch.profileLink, 'profile link');
    safe.updatedAt = new Date().toISOString();

    const result = app.repositories.clients.update(id, safe);
    app.events.emit('client.updated', result);
    return result;
  }

  function remove(id) {
    guard.assertManager('ClientService');
    const result = app.repositories.clients.softDelete(id);
    app.events.emit('client.deleted', result);
    return result;
  }

  function archive(id) {
    guard.assertManager('ClientService');
    return app.repositories.clients.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  function restore(id) {
    guard.assertManager('ClientService');
    return app.repositories.clients.update(id, { archivedAt: null, updatedAt: new Date().toISOString() });
  }

  return Object.freeze({ create, update, archive, restore, remove });
}
