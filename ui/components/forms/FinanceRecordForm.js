export function openFinanceRecordForm(app, { kind, projectId, record = null }) {
  const isPayment = kind === 'payment';
  const noun = isPayment ? 'payment' : 'delivery';
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-heading"><span class="eyebrow">Project finance</span><h2>${record ? 'Edit' : isPayment ? 'Add' : 'Record'} ${noun}</h2><p>${isPayment ? 'Track money received from the client.' : 'Track completed work delivered to the client.'}</p></div>
    <form class="modal-form" data-record-form novalidate>
      <label>${isPayment ? 'Amount' : 'Videos delivered'}<input name="value" type="number" inputmode="decimal" min="${isPayment ? '0.01' : '1'}" step="${isPayment ? '0.01' : '1'}" required></label>
      <label>Title<input name="title" type="text" maxlength="120" placeholder="${isPayment ? 'Payment' : 'Delivery'}"></label>
      <label>Date <span class="optional">(optional)</span><input name="date" type="date"></label>
      <p class="form-error" aria-live="polite"></p>
      <div class="modal-actions"><button class="secondary-action" type="button" data-cancel>Cancel</button><button class="primary-action" type="submit">${record ? 'Save changes' : isPayment ? 'Add payment' : 'Record delivery'}</button></div>
    </form>
  `;
  const form = content.querySelector('[data-record-form]');
  form.elements.value.value = record ? Number(isPayment ? record.amount : record.quantity) : isPayment ? '' : '1';
  form.elements.title.value = record?.title || '';
  form.elements.date.value = record?.date ? String(record.date).slice(0, 10) : '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const service = app.managers.get('FinanceService');
      const payload = isPayment
        ? { amount: Number(values.value), title: values.title, date: values.date }
        : { quantity: Number(values.value), title: values.title, date: values.date };
      if (record) {
        isPayment ? service.updatePayment(record.id, payload) : service.updateDelivery(record.id, payload);
      } else {
        isPayment ? service.addPayment({ ...payload, projectId }) : service.addDelivery({ ...payload, projectId });
      }
      app.modal.close();
    } catch (error_) {
      error.textContent = error_.message || `Could not save ${noun}.`;
    }
  });
  content.querySelector('[data-cancel]').addEventListener('click', () => app.modal.close());
  app.modal.open(content);
  form.elements.value.focus();
}
