export function renderSearchResults(root, results, onOpen) {
  root.replaceChildren();

  if (!results.length) {
    root.innerHTML = '<div class="search-empty">No results</div>';
    return;
  }

  for (const result of results) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';
    button.dataset.type = result.type;
    button.dataset.id = result.item.id;

    const title =
      result.item.name ??
      result.item.title ??
      result.item.email ??
      'Untitled';

    button.innerHTML = `
      <span class="search-type">${result.type}</span>
      <strong></strong>
      <small>${result.match === 'prefix' ? 'Starts with your search' : 'Contains your search'}</small>
    `;
    button.querySelector('strong').textContent = title;
    button.addEventListener('click', () => onOpen(result));
    root.append(button);
  }
}
