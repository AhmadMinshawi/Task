import { activeRecords, isActiveRecord } from '../core/recordState.js';

export function createSearchManager(app) {
  const LIMIT = 6;
  const text = value => String(value ?? '').trim().toLocaleLowerCase();
  const phone = value => text(value).replace(/[^\d+]/g, '');

  function search(input) {
    const q = text(input);
    if (!q) return [];
    const phoneQuery = phone(input);
    return activeRecords(app.state.get().clients ?? []).map(item => {
      const values = [text(item.name), text(item.email), text(item.phone)];
      const phoneValue = phone(item.phone);
      const prefix = values.some(value => value.startsWith(q)) || (phoneQuery && phoneValue.startsWith(phoneQuery));
      const contains = !prefix && (values.some(value => value.includes(q)) || (phoneQuery && phoneValue.includes(phoneQuery)));
      return prefix ? { type: 'clients', match: 'prefix', item } : contains ? { type: 'clients', match: 'contains', item } : null;
    }).filter(Boolean).sort((a, b) =>
      Number(a.match !== 'prefix') - Number(b.match !== 'prefix')
    );
  }

  function recentClients() {
    const state = app.state.get();
    const clients = new Map((state.clients ?? []).map(client => [client.id, client]));
    return (state.recentClientSearches ?? []).map(id => clients.get(id)).filter(isActiveRecord).slice(0, LIMIT);
  }

  function recordClient(clientId) {
    const client = (app.state.get().clients ?? []).find(item => item.id === clientId && isActiveRecord(item));
    if (!client) return false;
    app.state.update(state => {
      state.recentClientSearches = [clientId, ...(state.recentClientSearches ?? []).filter(id => id !== clientId)].slice(0, LIMIT);
    });
    return true;
  }

  function clearRecentClients() {
    app.state.update(state => { state.recentClientSearches = []; });
  }

  return Object.freeze({ search, recentClients, recordClient, clearRecentClients });
}
