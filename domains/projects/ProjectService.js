import { recordMeta, normalizeMoney, normalizeQuantity } from '../../core/record.js';

export function createProjectService(app) {
  const guard = app.managers.get('MutationGuard');
  function create({ name, clientId = null, pricePerVideo = 0, totalVideos = 0, pinned = false }) {
    guard.assertManager('ProjectService');
    if (!String(name ?? '').trim()) throw new Error('Project name is required');
    const meta = recordMeta(app);

    if (clientId) {
      const client = app.repositories.clients.findById(clientId);
      if (!client) throw new Error('Client not found');
    }

    const record = {
      id: crypto.randomUUID(),
      ...meta,
      clientId,
      name: String(name).trim(),
      pricePerVideo: normalizeMoney(pricePerVideo, 'pricePerVideo'),
      totalVideos: normalizeQuantity(totalVideos, 'totalVideos'),
      pinned: Boolean(pinned)
    };

    app.repositories.projects.insert(record);
    app.events.emit('project.created', record);
    return record;
  }

  function update(id, patch) {
    guard.assertManager('ProjectService');
    const safe = {};
    if (patch.name !== undefined) {
      if (!String(patch.name).trim()) throw new Error('Project name is required');
      safe.name = String(patch.name).trim();
    }
    if (patch.clientId !== undefined) {
      if (patch.clientId) {
        const client = app.repositories.clients.findById(patch.clientId);
        if (!client) throw new Error('Client not found');
      }
      safe.clientId = patch.clientId || null;
    }
    if (patch.pricePerVideo !== undefined) safe.pricePerVideo = normalizeMoney(patch.pricePerVideo, 'pricePerVideo');
    if (patch.totalVideos !== undefined) safe.totalVideos = normalizeQuantity(patch.totalVideos, 'totalVideos');
    if (patch.pinned !== undefined) safe.pinned = Boolean(patch.pinned);
    safe.updatedAt = new Date().toISOString();

    const result = app.repositories.projects.update(id, safe);
    app.events.emit('project.updated', result);
    return result;
  }

  function remove(id) {
    guard.assertManager('ProjectService');
    const result = app.repositories.projects.softDelete(id);
    app.events.emit('project.deleted', result);
    return result;
  }

  function archive(id) {
    guard.assertManager('ProjectService');
    return app.repositories.projects.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  function restore(id) {
    guard.assertManager('ProjectService');
    return app.repositories.projects.update(id, { archivedAt: null, updatedAt: new Date().toISOString() });
  }

  return Object.freeze({ create, update, archive, restore, remove });
}
