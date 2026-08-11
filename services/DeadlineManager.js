const DAY_MS = 86_400_000;

export function createDeadlineManager(app) {
  function alerts(today = new Date()) {
    const state = app.state.get();
    const items = [
      ...state.projects
        .filter(project => !project.deletedAt && !project.archivedAt && project.status !== 'completed' && project.deadline)
        .map(project => deadlineItem('project', project.id, project.name, project.deadline, today)),
      ...state.tasks
        .filter(task => !task.deletedAt && !task.archivedAt && !['done', 'cancelled'].includes(task.status) && task.dueDate)
        .map(task => deadlineItem('task', task.id, task.title, task.dueDate, today))
    ].filter(item => item && item.daysLeft <= 7);

    return items.sort((a, b) => a.daysLeft - b.daysLeft || a.title.localeCompare(b.title));
  }

  function count(today = new Date()) { return alerts(today).length; }

  return Object.freeze({ alerts, count });
}

function deadlineItem(type, id, title, value, today) {
  const due = dateNumber(value);
  if (due === null) return null;
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLeft = Math.round((due - current) / DAY_MS);
  const urgency = daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'soon' : 'upcoming';
  return Object.freeze({ type, id, title, date: String(value).slice(0, 10), daysLeft, urgency });
}

function dateNumber(value) {
  const match = String(value ?? '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = Date.UTC(year, month - 1, day);
  const check = new Date(date);
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? date : null;
}

export function deadlineLabel(alert) {
  if (alert.daysLeft < 0) return `${Math.abs(alert.daysLeft)} day${Math.abs(alert.daysLeft) === 1 ? '' : 's'} overdue`;
  if (alert.daysLeft === 0) return 'Due today';
  return `Due in ${alert.daysLeft} day${alert.daysLeft === 1 ? '' : 's'}`;
}
