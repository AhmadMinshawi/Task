import { deadlineLabel } from '../../services/DeadlineManager.js';

export function mountNotificationCenter(root, app, navigation) {
  root.innerHTML = `
    <button class="notification-trigger" type="button" data-notification-trigger aria-label="Notifications" aria-expanded="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      <span class="notification-badge" data-notification-count hidden></span>
    </button>
    <section class="notification-popover" data-notification-popover hidden aria-label="Deadline notifications">
      <div class="notification-head">
        <div><span class="eyebrow">Attention</span><strong>Notifications</strong></div>
        <span data-notification-summary></span>
      </div>
      <div class="notification-list" data-notification-list></div>
    </section>
  `;

  const trigger = root.querySelector('[data-notification-trigger]');
  const popover = root.querySelector('[data-notification-popover]');
  const count = root.querySelector('[data-notification-count]');
  const summary = root.querySelector('[data-notification-summary]');
  const list = root.querySelector('[data-notification-list]');

  function render() {
    const alerts = app.managers.get('DeadlineManager').alerts();
    count.textContent = alerts.length > 99 ? '99+' : String(alerts.length);
    count.hidden = alerts.length === 0;
    summary.textContent = alerts.length ? `${alerts.length} active` : 'All clear';
    list.replaceChildren();

    if (!alerts.length) {
      list.append(element('p', 'notification-empty', 'No overdue or upcoming deadlines.'));
      return;
    }

    for (const alert of alerts) {
      const item = element('button', `notification-item urgency-${alert.urgency}`);
      item.type = 'button';
      item.dataset.notificationType = alert.type;
      item.dataset.notificationId = alert.id;
      const marker = element('span', 'notification-kind', alert.type === 'project' ? 'P' : 'T');
      const copy = element('span', 'notification-copy');
      copy.append(
        element('strong', '', alert.title),
        element('small', '', `${alert.type === 'project' ? 'Project' : 'Task'} · ${formatDate(alert.date)}`)
      );
      item.append(marker, copy, element('span', 'notification-due', deadlineLabel(alert)));
      list.append(item);
    }
  }

  function setOpen(open) {
    popover.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  }

  function handleRootClick(event) {
    if (event.target.closest('[data-notification-trigger]')) {
      setOpen(popover.hidden);
      return;
    }
    const item = event.target.closest('[data-notification-type]');
    if (!item) return;
    setOpen(false);
    if (item.dataset.notificationType === 'project') navigation.openProject(item.dataset.notificationId);
    else navigation.openTasks();
  }

  function handleDocumentClick(event) {
    if (!popover.hidden && !root.contains(event.target)) setOpen(false);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && !popover.hidden) {
      setOpen(false);
      trigger.focus();
    }
  }

  root.addEventListener('click', handleRootClick);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);
  const unsubscribe = app.state.subscribe(render);
  render();

  return () => {
    unsubscribe();
    root.removeEventListener('click', handleRootClick);
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeydown);
  };
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}
