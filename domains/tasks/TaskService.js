import { recordMeta, normalizeOptionalDate, normalizeMoney } from '../../core/record.js';

const STATUSES = new Set(['todo', 'in_progress', 'done', 'cancelled']);

export function createTaskService(app) {
  const guard = app.managers.get('MutationGuard');
  function create({ title, projectId = null, dueDate = '', status = 'todo', amount = 0, incomeDate = '' }) {
    guard.assertManager('TaskService');
    if (!String(title ?? '').trim()) throw new Error('Task title is required');
    if (!STATUSES.has(status)) throw new Error('Invalid task status');

    if (projectId) {
      const project = app.repositories.projects.findById(projectId);
      if (!project) throw new Error('Project not found');
    }

    const record = {
      id: crypto.randomUUID(),
      ...recordMeta(app),
      projectId: projectId || null,
      title: String(title).trim(),
      status,
      dueDate: normalizeOptionalDate(dueDate),
      amount: normalizeMoney(amount),
      incomeDate: normalizeOptionalDate(incomeDate)
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
    if (patch.projectId !== undefined) {
      if (patch.projectId && !app.repositories.projects.findById(patch.projectId)) throw new Error('Project not found');
      safe.projectId = patch.projectId || null;
    }
    if (patch.amount !== undefined) safe.amount = normalizeMoney(patch.amount);
    if (patch.incomeDate !== undefined) safe.incomeDate = normalizeOptionalDate(patch.incomeDate);
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

  function archive(id) {
    guard.assertManager('TaskService');
    return app.repositories.tasks.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  function restore(id) {
    guard.assertManager('TaskService');
    return app.repositories.tasks.update(id, { archivedAt: null, updatedAt: new Date().toISOString() });
  }

  return Object.freeze({ create, update, archive, restore, remove });
}
