import { OwnedRepository } from './OwnedRepository.js';

export function createRepositories(app) {
  const names = [
    'clients', 'projects', 'tasks', 'payments',
    'deliveries', 'expenses', 'activities'
  ];

  function repositoryFor(name) {
    const ownerId = () => app.state.get().session?.userId ?? null;

    function repo() {
      const id = ownerId();
      if (!id) throw new Error('Authenticated owner required');
      return new OwnedRepository(app, name, id);
    }

    return Object.freeze({
      all(options = {}) { return repo().all(options); },
      findById(id, options = {}) { return repo().findById(id, options); },
      insert(record) {
        const owner = ownerId();
        if (!owner || record.ownerId !== owner) throw new Error('Ownership mismatch');
        return repo().insert(record);
      },
      update(id, patch) { return repo().update(id, patch); },
      softDelete(id) { return repo().softDelete(id); },
      restoreDeleted(id) { return repo().restoreDeleted(id); },
      hardDelete(id) { return repo().hardDelete(id); }
    });
  }

  return Object.freeze(Object.fromEntries(names.map(name => [name, repositoryFor(name)])));
}
