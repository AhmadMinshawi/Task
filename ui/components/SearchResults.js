export function renderSearchResults(root, clients, { onOpen, recent = false, onClear } = {}) {
  root.replaceChildren();

  if (recent && clients.length) {
    const heading = document.createElement('div');
    heading.className = 'search-history-heading';
    heading.innerHTML = '<strong>آخر عمليات البحث</strong><button type="button">إزالة عمليات البحث</button>';
    heading.querySelector('button').addEventListener('click', onClear);
    root.append(heading);
  }

  if (!clients.length) {
    root.innerHTML = recent ? '<div class="search-empty">لا توجد عمليات بحث محفوظة</div>' : '<div class="search-empty">لم يتم العثور على عميل</div>';
    return;
  }

  for (const entry of clients) {
    const result = entry.item ? entry : { type: 'clients', item: entry };
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';
    button.dataset.type = result.type;
    button.dataset.id = result.item.id;

    button.innerHTML = `
      <span class="search-type">عميل</span>
      <strong></strong>
      <small></small>
    `;
    button.querySelector('strong').textContent = result.item.name || 'عميل بدون اسم';
    button.querySelector('small').textContent = [result.item.email, result.item.phone].filter(Boolean).join(' · ') || 'لا توجد بيانات اتصال';
    button.addEventListener('click', () => onOpen(result));
    root.append(button);
  }
}
