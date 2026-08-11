export function recordMeta(app) {
  const ownerId = app.state.get().session?.userId;
  if (!ownerId) throw new Error('Authenticated owner required');
  return {
    ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: null,
    deletedAt: null
  };
}

export function normalizeOptionalDate(value) {
  if (value === '' || value == null) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return d.toISOString();
}

export function normalizeMoney(value, field = 'amount') {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${field}`);
  return Math.round(n * 100) / 100;
}

export function normalizeQuantity(value, field = 'quantity') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error(`Invalid ${field}`);
  return n;
}
