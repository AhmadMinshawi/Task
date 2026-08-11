import { Repository } from './Repository.js';

export class OwnedRepository extends Repository {
  #ownerId;

  constructor(app, collection, ownerId) {
    super(app, collection);
    this.#ownerId = ownerId;
  }

  all(options = {}) {
    return super.all(options).filter(row => row.ownerId === this.#ownerId);
  }

  findById(id, options = {}) {
    const row = super.findById(id, options);
    if (!row) return null;
    if (row.ownerId !== this.#ownerId) throw new Error('Access denied');
    return row;
  }

  insert(record) {
    if (record.ownerId !== this.#ownerId) throw new Error('Owner mismatch');
    return super.insert(record);
  }

  restoreDeleted(id) {
    this.findById(id, { includeDeleted: true });
    return super.restoreDeleted(id);
  }

  hardDelete(id) {
    this.findById(id, { includeDeleted: true });
    return super.hardDelete(id);
  }
}
