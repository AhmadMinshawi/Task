export function mountAccountMenu(root, user, actions) {
  root.innerHTML = `
    <button class="account-menu-trigger" type="button" data-account-trigger aria-label="Open account menu" aria-expanded="false">
      <span class="profile-avatar" data-account-avatar></span>
      <span class="account-menu-name" data-account-name></span>
      <span class="account-chevron" aria-hidden="true">⌄</span>
    </button>
    <div class="account-popover" data-account-popover hidden>
      <div class="account-summary"><strong data-account-summary-name></strong><small data-account-email></small></div>
      <button type="button" data-account-route="profile"><span>♙</span><div><strong>Profile</strong><small>Personal information and password</small></div></button>
      <button type="button" data-account-route="settings"><span>⚙</span><div><strong>Settings</strong><small>Archive, basket and workspace</small></div></button>
      <button class="account-signout" type="button" data-account-signout><span>↪</span><div><strong>Sign out</strong><small>End this session</small></div></button>
    </div>
  `;

  const trigger = root.querySelector('[data-account-trigger]');
  const popover = root.querySelector('[data-account-popover]');
  const displayName = user?.name || 'Account';
  root.querySelector('[data-account-avatar]').textContent = (displayName || user?.email || 'U').slice(0, 1).toUpperCase();
  root.querySelector('[data-account-name]').textContent = displayName;
  root.querySelector('[data-account-summary-name]').textContent = displayName;
  root.querySelector('[data-account-email]').textContent = user?.email || '';

  function setOpen(open) {
    popover.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  }

  function handleRootClick(event) {
    if (event.target.closest('[data-account-trigger]')) {
      setOpen(popover.hidden);
      return;
    }
    const route = event.target.closest('[data-account-route]')?.dataset.accountRoute;
    if (route) {
      setOpen(false);
      actions.navigate(route);
      return;
    }
    if (event.target.closest('[data-account-signout]')) {
      setOpen(false);
      void actions.signOut();
    }
  }

  function handleDocumentClick(event) {
    if (!popover.hidden && !root.contains(event.target)) setOpen(false);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && !popover.hidden) {
      setOpen(false);
      trigger.focus();
    }
  }

  root.addEventListener('click', handleRootClick);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);
  return () => {
    root.removeEventListener('click', handleRootClick);
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeydown);
  };
}
