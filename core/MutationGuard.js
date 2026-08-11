export function createMutationGuard(app) {
  const allowed = new Set([
    'ClientService',
    'ProjectService',
    'TaskService',
    'FinanceService',
    'ExpenseService'
  ]);

  function assertManager(name) {
    if (!allowed.has(name)) {
      throw new Error(`Mutation not allowed through ${name}`);
    }

    const userId = app.state.get().session?.userId;
    if (!userId) {
      throw new Error('Authenticated owner required');
    }

    return userId;
  }

  function assertRecordOwner(name, record) {
    const userId = assertManager(name);

    if (!record || record.ownerId !== userId || record.deletedAt) {
      throw new Error('Access denied');
    }

    return userId;
  }

  return Object.freeze({
    assertManager,
    assertRecordOwner
  });
}
