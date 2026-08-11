export function createSearchManager(app) {
  const fields = Object.freeze({
    projects: ['name'],
    clients: ['name', 'email', 'phone'],
    tasks: ['title'],
    payments: ['title'],
    deliveries: ['title']
  });

  function search(input) {
    const q = String(input ?? '').trim().toLocaleLowerCase();
    if (!q) return [];

    const state = app.state.get();
    const results = [];

    for (const [type, keys] of Object.entries(fields)) {
      for (const item of state[type] ?? []) {
        if (item.deletedAt) continue;

        const values = keys.map(key => String(item[key] ?? '').toLocaleLowerCase());
        const prefix = values.some(value => value.startsWith(q));
        const contains = !prefix && values.some(value => value.includes(q));

        if (prefix) results.push({ type, match: 'prefix', item });
        else if (contains) results.push({ type, match: 'contains', item });
      }
    }

    return results.sort((a, b) =>
      Number(a.match !== 'prefix') - Number(b.match !== 'prefix')
    );
  }

  return Object.freeze({ search });
}
