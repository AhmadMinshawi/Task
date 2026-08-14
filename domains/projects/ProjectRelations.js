import { isActiveRecord } from '../../core/recordState.js';

const LINKED_COLLECTIONS = Object.freeze(['payments', 'deliveries', 'tasks', 'expenses', 'activities']);

export function projectIsActive(project) {
  return isActiveRecord(project);
}

export function activeProjectIds(state) {
  return new Set((state.projects ?? []).filter(projectIsActive).map(project => project.id));
}

export function purgeProjectGraph(app, projectId) {
  let removed = null;
  app.state.update(state => {
    const project = (state.projects ?? []).find(item => item.id === projectId);
    if (!project?.deletedAt) throw new Error('Deleted project not found');
    if (project.ownerId !== state.session?.userId) throw new Error('Access denied');
    removed = structuredClone(project);
    state.projects = state.projects.filter(item => item.id !== projectId);
    for (const collection of LINKED_COLLECTIONS) {
      state[collection] = (state[collection] ?? []).filter(item => item.projectId !== projectId);
    }
  });
  return removed;
}
