export function createPersistenceManager(app, repository) {
  let loaded = false;
  let loadedUserId = null;
  let saving = false;
  let pending = false;
  let lastError = null;
  const unsubs = [];

  async function load(userId) {
    const state = await repository.load(userId);
    app.state.replace(state);
    loadedUserId = userId;
    loaded = true;
    app.events.emit('persistence.loaded', { revision: repository.currentRevision() });
    return state;
  }

  async function flush() {
    if (!loaded || app.state.get().session?.userId !== loadedUserId) return false;
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
    if (unsubs.length) return;
    unsubs.push(app.state.subscribe(() => void flush().catch(() => {})));
  }

  function stop() {
    while (unsubs.length) unsubs.pop()?.();
  }

  function status() {
    return Object.freeze({ loaded, saving, pending, lastError, revision: repository.currentRevision() });
  }

  return Object.freeze({ load, flush, watch, stop, status });
}
