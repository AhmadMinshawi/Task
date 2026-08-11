export class AppState {
  #state;
  #listeners = new Set();

  constructor(initial = {}) {
    this.#state = structuredClone(initial);
  }

  get() { return this.#state; }
  snapshot() { return structuredClone(this.#state); }

  replace(nextState) {
    this.#state = structuredClone(nextState);
    this.#notify();
  }

  update(mutator) {
    const draft = structuredClone(this.#state);
    mutator(draft);
    this.#state = draft;
    this.#notify();
  }

  setSession(session) {
    this.update(state => {
      state.session = session ? structuredClone(session) : null;
    });
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify() {
    const snapshot = this.snapshot();
    for (const listener of this.#listeners) listener(snapshot);
  }
}
