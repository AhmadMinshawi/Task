export const PROJECT_STATUSES = Object.freeze(['new', 'in_progress', 'ready', 'completed']);

const LEGACY_STATUS = Object.freeze({ progress: 'in_progress', active: 'in_progress', done: 'completed', complete: 'completed' });

export function normalizeProjectStatus(value = 'new') {
  const status = LEGACY_STATUS[value] || value || 'new';
  if (!PROJECT_STATUSES.includes(status)) throw new Error('Invalid project status');
  return status;
}

export function displayProjectStatus(project, today = new Date()) {
  let status = 'new';
  try { status = normalizeProjectStatus(project.status || 'new'); } catch { /* tolerate unknown legacy values */ }
  if (status === 'completed' || !project.deadline) return status;
  const deadline = new Date(`${String(project.deadline).slice(0, 10)}T23:59:59`);
  return !Number.isNaN(deadline.getTime()) && deadline < today ? 'overdue' : status;
}

export function projectStatusLabel(status) {
  return ({ new: 'New', in_progress: 'In progress', ready: 'Ready to deliver', completed: 'Completed', overdue: 'Overdue' })[status] || status;
}
