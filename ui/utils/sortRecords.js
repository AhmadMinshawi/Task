const SORTERS = Object.freeze({
  name: (a, b, label) => label(a).localeCompare(label(b), undefined, { sensitivity: 'base', numeric: true }),
  oldest: (a, b) => timestamp(a.createdAt) - timestamp(b.createdAt),
  newest: (a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)
});

export function sortRecords(records, mode = 'newest', { label = item => item.name ?? item.title ?? '', pinned = false } = {}) {
  const sorter = SORTERS[mode] ?? SORTERS.newest;
  return [...records].sort((a, b) => {
    if (pinned) {
      const pinOrder = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
      if (pinOrder) return pinOrder;
    }
    const order = sorter(a, b, label);
    return order || label(a).localeCompare(label(b), undefined, { sensitivity: 'base', numeric: true });
  });
}

function timestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}
