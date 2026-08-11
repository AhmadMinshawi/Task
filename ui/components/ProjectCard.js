export function createProjectCard(project, finance) {
  const el = document.createElement('article');
  el.className = 'project-card';
  el.dataset.projectId = project.id;

  const head = document.createElement('div');
  head.className = 'project-card-head';

  const info = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'Project';
  const title = document.createElement('h3');
  title.textContent = project.name;
  info.append(eyebrow, title);

  const pin = document.createElement('button');
  pin.className = 'pin-button';
  pin.type = 'button';
  pin.dataset.pinProject = project.id;
  pin.setAttribute('aria-label', project.pinned ? 'Unpin project' : 'Pin project');
  pin.setAttribute('aria-pressed', String(Boolean(project.pinned)));
  pin.textContent = project.pinned ? '★' : '☆';
  head.append(info, pin);

  const metrics = document.createElement('div');
  metrics.className = 'project-metrics';
  metrics.append(
    metric('Price / video', money(project.pricePerVideo)),
    metric('Paid', money(finance.paid)),
    metric('Delivered', String(finance.deliveredVideos)),
    metric('Remaining paid', String(finance.remainingPaidVideos))
  );

  const foot = document.createElement('div');
  foot.className = 'project-card-foot';
  const remaining = document.createElement('span');
  remaining.textContent = `${money(finance.remainingPaidValue)} remaining value`;
  const open = document.createElement('button');
  open.className = 'open-project';
  open.type = 'button';
  open.dataset.projectId = project.id;
  open.textContent = 'Open';
  foot.append(remaining, open);

  el.append(head, metrics, foot);
  return el;
}

function metric(label, value) {
  const wrapper = document.createElement('div');
  const text = document.createElement('span');
  text.textContent = label;
  const valueEl = document.createElement('strong');
  valueEl.textContent = value;
  wrapper.append(text, valueEl);
  return wrapper;
}

function money(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0);
}
