export class Repository {
  constructor(app, collection) {
    this.app = app;
    this.collection = collection;
  }

  all({ includeDeleted = false } = {}) {
    const rows = this.app.state.get()[this.collection] ?? [];
    return rows.filter(row => includeDeleted || !row.deletedAt);
  }

  findById(id, { includeDeleted = false } = {}) {
    return this.all({ includeDeleted }).find(row => row.id === id) ?? null;
  }

  insert(record) {
    this.app.state.update(state => {
      if (!Array.isArray(state[this.collection])) state[this.collection] = [];
      state[this.collection].push(structuredClone(record));
    });
    return structuredClone(record);
  }

  update(id, patch) {
    let updated = null;
    this.app.state.update(state => {
      const row = (state[this.collection] ?? []).find(x => x.id === id && !x.deletedAt);
      if (!row) throw new Error(`${this.collection} record not found`);
      Object.assign(row, structuredClone(patch));
      updated = structuredClone(row);
    });
    return updated;
  }

  softDelete(id) {
    const deletedAt = new Date().toISOString();
    this.update(id, { deletedAt, updatedAt: deletedAt });
  }

  restoreDeleted(id) {
    let restored = null;
    this.app.state.update(state => {
      const row = (state[this.collection] ?? []).find(x => x.id === id && x.deletedAt);
      if (!row) throw new Error(`${this.collection} deleted record not found`);
      row.deletedAt = null;
      row.archivedAt = null;
      row.updatedAt = new Date().toISOString();
      restored = structuredClone(row);
    });
    return restored;
  }

  hardDelete(id) {
    this.app.state.update(state => {
      state[this.collection] = (state[this.collection] ?? []).filter(row => row.id !== id);
    });
  }
}
