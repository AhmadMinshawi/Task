import { recordMeta, normalizeMoney, normalizeQuantity, normalizeOptionalDate } from '../../core/record.js';
import { normalizeProjectStatus } from './ProjectStatus.js';

export function createProjectService(app) {
  const guard = app.managers.get('MutationGuard');
  function create({ name, clientId = null, pricePerVideo = 0, totalVideos = 0, pinned = false, deadline = '', status = 'new' }) {
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
      pinned: Boolean(pinned),
      deadline: normalizeOptionalDate(deadline),
      status: normalizeProjectStatus(status)
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
    if (patch.deadline !== undefined) safe.deadline = normalizeOptionalDate(patch.deadline);
    if (patch.status !== undefined) safe.status = normalizeProjectStatus(patch.status);
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

  function restoreDeleted(id) {
    guard.assertManager('ProjectService');
    return app.repositories.projects.restoreDeleted(id);
  }

  function emptyTrash() {
    guard.assertManager('ProjectService');
    const deleted = app.repositories.projects.all({ includeDeleted: true }).filter(project => project.deletedAt);
    for (const project of deleted) app.repositories.projects.hardDelete(project.id);
    return deleted.length;
  }

  function purgeDeleted(id) {
    guard.assertManager('ProjectService');
    const project = app.repositories.projects.findById(id, { includeDeleted: true });
    if (!project?.deletedAt) throw new Error('Deleted project not found');
    return app.repositories.projects.hardDelete(id);
  }

  return Object.freeze({ create, update, archive, restore, remove, restoreDeleted, emptyTrash, purgeDeleted });
}
