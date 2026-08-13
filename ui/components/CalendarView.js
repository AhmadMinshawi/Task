import { isActiveRecord } from '../../core/recordState.js';

export function renderCalendarView(root, app) {
  let cursor = new Date();
  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  root.innerHTML = `
    <div class="page-heading"><div><span class="eyebrow">Schedule</span><h1>Calendar</h1></div><div class="calendar-controls"><button class="secondary-action" type="button" data-calendar-prev>←</button><strong data-calendar-label></strong><button class="secondary-action" type="button" data-calendar-next>→</button></div></div>
    <section class="dashboard-card calendar-card"><div class="calendar-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="calendar-grid" data-calendar-grid></div></section>
  `;

  const render = () => {
    root.querySelector('[data-calendar-label]').textContent = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(cursor);
    renderMonth(root.querySelector('[data-calendar-grid]'), app.state.get(), cursor);
  };
  const handleClick = event => {
    if (event.target.closest('[data-calendar-prev]')) cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    else if (event.target.closest('[data-calendar-next]')) cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    else return;
    render();
  };
  root.addEventListener('click', handleClick);
  render();
  const unsubscribe = app.state.subscribe(render);
  return () => { unsubscribe(); root.removeEventListener('click', handleClick); };
}

function renderMonth(container, state, month) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const events = calendarEvents(state);
  container.replaceChildren();
  for (let blank = 0; blank < firstDay; blank += 1) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day is-blank';
    container.append(cell);
  }
  for (let day = 1; day <= days; day += 1) {
    const dateKey = localKey(year, monthIndex, day);
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    const number = document.createElement('strong');
    number.textContent = String(day);
    cell.append(number);
    for (const event of events.filter(item => item.date === dateKey)) {
      const badge = document.createElement('span');
      badge.className = `calendar-event ${event.type}`;
      badge.textContent = event.title;
      badge.title = `${event.type}: ${event.title}`;
      badge.dataset.openProject = '';
      badge.dataset.projectId = event.projectId;
      cell.append(badge);
    }
    container.append(cell);
  }
}

function calendarEvents(state) {
  return [
    ...state.projects.filter(project => isActiveRecord(project) && project.deadline).map(project => ({ type: 'project', projectId: project.id, title: `${project.name} — deadline`, date: String(project.deadline).slice(0, 10) })),
    ...state.projects.filter(isActiveRecord).flatMap(project =>
      (Array.isArray(project.notes) ? project.notes : []).filter(note => note.date).map(note => ({
        type: 'note',
        projectId: project.id,
        title: `${project.name}: ${note.text}`,
        date: String(note.date).slice(0, 10)
      }))
    )
  ];
}

function localKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
