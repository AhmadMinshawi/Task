import { displayProjectStatus, projectStatusLabel } from '../../domains/projects/ProjectStatus.js';

export function renderProjectWorkspace(root, app, projectId) {
  if (!projectId) throw new Error('Project id is required');
  const state = app.state.get();
  const project = state.projects.find(p => p.id === projectId && !p.deletedAt);
  if (!project) {
    root.textContent = 'Project not found.';
    return () => {};
  }

  root.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Project workspace</span><h1 data-name></h1></div>
      <div class="page-actions"><a class="secondary-action detail-link" data-project-link target="_blank" rel="noopener noreferrer" hidden>Open project link</a><label class="status-control">Status<select data-project-status><option value="new">New</option><option value="in_progress">In progress</option><option value="ready">Ready to deliver</option><option value="completed">Completed</option></select></label><button type="button" class="secondary-action" data-back>Back</button></div>
    </div>

    <section class="project-summary" data-summary></section>

    <div class="workspace-columns">
      <form class="quick-add" data-payment-form>
        <strong>Add payment</strong>
        <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required></label>
        <label>Title<input name="title" type="text" maxlength="120" placeholder="Payment"></label>
        <label>Date <span class="optional">(optional)</span><input name="date" type="date"></label>
        <button type="submit">Add payment</button>
        <p class="form-error"></p>
      </form>

      <form class="quick-add" data-delivery-form>
        <strong>Add delivery</strong>
        <label>Videos delivered<input name="quantity" type="number" min="1" step="1" value="1" required></label>
        <label>Title<input name="title" type="text" maxlength="120" placeholder="Delivery"></label>
        <label>Date <span class="optional">(optional)</span><input name="date" type="date"></label>
        <button type="submit">Add delivery</button>
        <p class="form-error"></p>
      </form>
    </div>
  `;

  root.querySelector('[data-name]').textContent = project.name;

  const refresh = () => {
    const s = app.state.get();
    const p = s.projects.find(x => x.id === projectId && !x.deletedAt);
    const payments = s.payments.filter(x => x.projectId === projectId && !x.deletedAt);
    const deliveries = s.deliveries.filter(x => x.projectId === projectId && !x.deletedAt);
    const f = app.managers.get('FinanceEngine').project(p, payments, deliveries);
    const displayStatus = displayProjectStatus(p);
    const statusSelect = root.querySelector('[data-project-status]');
    const projectLink = root.querySelector('[data-project-link]');
    statusSelect.value = p.status || 'new';
    statusSelect.className = `status-${displayStatus}`;
    projectLink.hidden = !p.projectLink;
    if (p.projectLink) projectLink.href = p.projectLink;
    else projectLink.removeAttribute('href');

    root.querySelector('[data-summary]').innerHTML = `
      <div><span>Status</span><strong class="status-text status-${displayStatus}">${projectStatusLabel(displayStatus)}</strong></div>
      <div><span>Project value</span><strong>${money(f.grossProjectValue)}</strong></div>
      <div><span>Paid</span><strong>${money(f.paid)}</strong></div>
      <div><span>Delivered</span><strong>${f.deliveredVideos}</strong></div>
      <div><span>Remaining paid videos</span><strong>${f.remainingPaidVideos}</strong></div>
      <div><span>Remaining paid value</span><strong>${money(f.remainingPaidValue)}</strong></div>
    `;
  };

  const paymentForm = root.querySelector('[data-payment-form]');
  const deliveryForm = root.querySelector('[data-delivery-form]');
  const statusSelect = root.querySelector('[data-project-status]');

  statusSelect.addEventListener('change', () => {
    app.managers.get('ProjectService').update(projectId, { status: statusSelect.value });
  });

  paymentForm.addEventListener('submit', e => {
    e.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(paymentForm).entries());
      app.managers.get('FinanceService').addPayment({ ...data, projectId });
      paymentForm.reset();
      refresh();
    } catch (err) {
      paymentForm.querySelector('.form-error').textContent = err.message;
    }
  });

  deliveryForm.addEventListener('submit', e => {
    e.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(deliveryForm).entries());
      app.managers.get('FinanceService').addDelivery({ ...data, projectId, quantity: Number(data.quantity) });
      deliveryForm.reset();
      refresh();
    } catch (err) {
      deliveryForm.querySelector('.form-error').textContent = err.message;
    }
  });

  refresh();
  return app.state.subscribe(refresh);
}

function money(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0);
}
