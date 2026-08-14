import { renderSearchResults } from './SearchResults.js';

export function mountGlobalSearch(root, app, { openClient }) {
  const input = root.querySelector('#global-search');
  const resultsRoot = root.querySelector('#search-results');
  const manager = app.managers.get('SearchManager');

  const openResult = result => {
    manager.recordClient(result.item.id);
    input.value = '';
    resultsRoot.hidden = true;
    openClient(result.item.id);
  };

  const showRecent = () => {
    renderSearchResults(resultsRoot, manager.recentClients(), {
      recent: true,
      onOpen: openResult,
      onClear: () => { manager.clearRecentClients(); showRecent(); }
    });
    resultsRoot.hidden = false;
  };

  const handleFocus = () => {
    if (!input.value.trim()) showRecent();
  };
  const handleInput = event => {
    const query = event.target.value.trim();
    if (!query) return showRecent();
    renderSearchResults(resultsRoot, manager.search(query), { onOpen: openResult });
    resultsRoot.hidden = false;
  };
  const handleOutsideClick = event => {
    if (!root.contains(event.target)) resultsRoot.hidden = true;
  };

  input.addEventListener('focus', handleFocus);
  input.addEventListener('input', handleInput);
  document.addEventListener('click', handleOutsideClick);

  return () => {
    input.removeEventListener('focus', handleFocus);
    input.removeEventListener('input', handleInput);
    document.removeEventListener('click', handleOutsideClick);
  };
}
