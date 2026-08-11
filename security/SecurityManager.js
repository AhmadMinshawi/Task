export function createSecurityManager(app) {
  function requireAuth() {
    const userId = app.state.get().session?.userId;
    if (!userId) throw new Error('Authentication required');
    return userId;
  }

  function canAccess(record) {
    const userId = app.state.get().session?.userId;
    return Boolean(userId && record && record.ownerId === userId && !record.deletedAt);
  }

  function assertOwner(record) {
    if (!canAccess(record)) throw new Error('Access denied');
    return true;
  }

  return Object.freeze({ requireAuth, canAccess, assertOwner });
}
