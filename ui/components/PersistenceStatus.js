export function mountPersistenceStatus(root, app) {
  let hideTimer = null;

  const setStatus = (mode, message, temporary = false) => {
    clearTimeout(hideTimer);
    root.dataset.status = mode;
    root.textContent = message;
    root.title = '';
    root.hidden = mode === 'idle';
    if (temporary) hideTimer = setTimeout(() => setStatus('idle', ''), 1400);
  };

  const unsubscribers = [
    app.events.on('persistence.loaded', () => setStatus('idle', '')),
    app.events.on('persistence.saving', () => setStatus('saving', 'جارٍ الحفظ…')),
    app.events.on('persistence.saved', () => setStatus('saved', 'تم الحفظ', true)),
    app.events.on('persistence.error', error => {
      const conflict = String(error?.message || '').toLowerCase().includes('conflict');
      setStatus('error', conflict ? 'تعارض في الحفظ — أعد تحميل الصفحة' : 'لم يتم الحفظ — اضغط للمحاولة');
      root.title = error?.message || 'تعذر حفظ البيانات';
    })
  ];

  const retry = () => {
    const manager = app.managers.get('PersistenceManager');
    const error = manager.status().lastError;
    if (!error) return;
    if (String(error.message || '').toLowerCase().includes('conflict')) {
      window.location.reload();
      return;
    }
    void manager.flush().catch(() => {});
  };
  root.addEventListener('click', retry);

  return () => {
    clearTimeout(hideTimer);
    root.removeEventListener('click', retry);
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}
