export class EventBus {
  #listeners = new Map();

  on(event, handler) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    const set = this.#listeners.get(event) ?? new Set();
    set.add(handler);
    this.#listeners.set(event, set);
    return () => set.delete(handler);
  }

  emit(event, payload) {
    const handlers = this.#listeners.get(event);
    if (!handlers) return;
    for (const handler of [...handlers]) handler(payload);
  }

  clear() { this.#listeners.clear(); }
}
