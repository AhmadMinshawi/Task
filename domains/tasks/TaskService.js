import { recordMeta, normalizeOptionalDate } from '../../core/record.js';

const STATUSES = new Set(['todo', 'in_progress', 'done', 'cancelled']);

export function createTaskService(app) {
  const guard = app.managers.get('MutationGuard');
  function create({ title, projectId, dueDate = '', status = 'todo' }) {
    guard.assertManager('TaskService');
    if (!String(title ?? '').trim()) throw new Error('Task title is required');
    if (!projectId) throw new Error('Project is required');
    if (!STATUSES.has(status)) throw new Error('Invalid task status');

    const project = app.repositories.projects.findById(projectId);
    if (!project) throw new Error('Project not found');

    const record = {
      id: crypto.randomUUID(),
      ...recordMeta(app),
      projectId,
      title: String(title).trim(),
      status,
      dueDate: normalizeOptionalDate(dueDate)
    };

    app.repositories.tasks.insert(record);
    app.events.emit('task.created', record);
    return record;
  }

  function update(id, patch) {
    guard.assertManager('TaskService');
    const safe = {};
    if (patch.title !== undefined) {
      if (!String(patch.title).trim()) throw new Error('Task title is required');
      safe.title = String(patch.title).trim();
    }
    if (patch.status !== undefined) {
      if (!STATUSES.has(patch.status)) throw new Error('Invalid task status');
      safe.status = patch.status;
    }
    if (patch.dueDate !== undefined) safe.dueDate = normalizeOptionalDate(patch.dueDate);
    safe.updatedAt = new Date().toISOString();

    const result = app.repositories.tasks.update(id, safe);
    app.events.emit('task.updated', result);
    return result;
  }

  function remove(id) {
    guard.assertManager('TaskService');
    const result = app.repositories.tasks.softDelete(id);
    app.events.emit('task.deleted', result);
    return result;
  }

  return Object.freeze({ create, update, remove });
}
