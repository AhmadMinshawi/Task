export class ManagerRegistry {
  #items = new Map();

  register(name, manager) {
    if (this.#items.has(name)) throw new Error(`Manager already registered: ${name}`);
    this.#items.set(name, manager);
    return manager;
  }

  get(name) {
    const manager = this.#items.get(name);
    if (!manager) throw new Error(`Manager not registered: ${name}`);
    return manager;
  }

  has(name) { return this.#items.has(name); }
}
