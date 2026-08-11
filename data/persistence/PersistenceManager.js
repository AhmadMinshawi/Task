export function createPersistenceManager(app, repository) {
  let loaded = false;
  let saving = false;
  let pending = false;
  let lastError = null;
  const unsubs = [];

  async function load(userId) {
    const state = await repository.load(userId);
    app.state.replace(state);
    loaded = true;
    app.events.emit('persistence.loaded', { revision: repository.currentRevision() });
    return state;
  }

  async function flush() {
    if (!loaded) return false;
    if (saving) { pending = true; return false; }

    saving = true;
    try {
      await repository.save(app.state.snapshot());
      lastError = null;
      app.events.emit('persistence.saved', { revision: repository.currentRevision() });
      return true;
    } catch (error) {
      lastError = error;
      app.events.emit('persistence.error', error);
      throw error;
    } finally {
      saving = false;
      if (pending) {
        pending = false;
        queueMicrotask(() => void flush().catch(() => {}));
      }
    }
  }

  function watch() {
    const events = [
      'client.created','client.updated','client.deleted',
      'project.created','project.updated','project.deleted',
      'task.created','task.updated','task.deleted',
      'payment.created','delivery.created',
      'expense.created','expense.updated','expense.deleted'
    ];
    for (const event of events) unsubs.push(app.events.on(event, () => void flush().catch(() => {})));
  }

  function stop() {
    while (unsubs.length) unsubs.pop()?.();
  }

  function status() {
    return Object.freeze({ loaded, saving, pending, lastError, revision: repository.currentRevision() });
  }

  return Object.freeze({ load, flush, watch, stop, status });
}
