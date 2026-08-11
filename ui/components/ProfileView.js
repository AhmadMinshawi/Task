export function renderProfileView(root, app) {
  const auth = app.managers.get('AuthManager');
  const user = auth.user();
  root.innerHTML = `
    <div class="page-heading"><div><span class="eyebrow">Account</span><h1>Profile</h1></div></div>
    <div class="profile-layout">
      <section class="dashboard-card profile-card">
        <div class="dashboard-card-head"><div><span class="eyebrow">Personal information</span><h2>Account details</h2></div></div>
        <form class="modal-form" data-profile-form novalidate>
          <label>Name<input name="name" type="text" maxlength="120" autocomplete="name" required></label>
          <label>Email<input name="email" type="email" maxlength="160" autocomplete="email" required></label>
          <p class="field-hint">Changing your email may require confirmation from your inbox.</p>
          <p class="form-message" data-profile-message aria-live="polite"></p>
          <div class="modal-actions"><button class="primary-action" type="submit">Save information</button></div>
        </form>
      </section>
      <section class="dashboard-card profile-card">
        <div class="dashboard-card-head"><div><span class="eyebrow">Security</span><h2>Change password</h2></div></div>
        <form class="modal-form" data-password-form novalidate>
          <label>Current password<input name="currentPassword" type="password" autocomplete="current-password" required></label>
          <label>New password<input name="newPassword" type="password" minlength="8" autocomplete="new-password" required></label>
          <label>Confirm new password<input name="confirmPassword" type="password" minlength="8" autocomplete="new-password" required></label>
          <p class="form-message" data-password-message aria-live="polite"></p>
          <div class="modal-actions"><button class="primary-action" type="submit">Update password</button></div>
        </form>
      </section>
      <section class="dashboard-card profile-card profile-danger">
        <div><span class="eyebrow">Account control</span><h2>Delete account</h2><p>Permanent Auth deletion needs a protected server endpoint. It is unavailable until that endpoint is configured without exposing administrator credentials.</p></div>
        <button class="secondary-action danger-action" type="button" disabled title="Secure deletion endpoint is not configured">Delete account</button>
      </section>
    </div>
  `;

  const profileForm = root.querySelector('[data-profile-form]');
  profileForm.elements.name.value = user?.name || '';
  profileForm.elements.email.value = user?.email || '';

  const handleProfile = async event => {
    event.preventDefault();
    const message = root.querySelector('[data-profile-message]');
    message.className = 'form-message';
    message.textContent = '';
    try {
      const values = Object.fromEntries(new FormData(profileForm).entries());
      await auth.updateProfile(values);
      message.classList.add('is-success');
      message.textContent = values.email === user?.email ? 'Profile updated.' : 'Profile updated. Check your inbox to confirm the new email.';
    } catch (error) {
      message.classList.add('is-error');
      message.textContent = error.message || 'Could not update your profile.';
    }
  };

  const passwordForm = root.querySelector('[data-password-form]');
  const handlePassword = async event => {
    event.preventDefault();
    const message = root.querySelector('[data-password-message]');
    message.className = 'form-message';
    message.textContent = '';
    const values = Object.fromEntries(new FormData(passwordForm).entries());
    if (values.newPassword.length < 8) {
      message.classList.add('is-error');
      message.textContent = 'Use at least 8 characters.';
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      message.classList.add('is-error');
      message.textContent = 'The new passwords do not match.';
      return;
    }
    try {
      await auth.updatePassword(values.currentPassword, values.newPassword);
      passwordForm.reset();
      message.classList.add('is-success');
      message.textContent = 'Password updated successfully.';
    } catch (error) {
      message.classList.add('is-error');
      message.textContent = error.message || 'Could not update your password.';
    }
  };

  profileForm.addEventListener('submit', handleProfile);
  passwordForm.addEventListener('submit', handlePassword);
  return () => {
    profileForm.removeEventListener('submit', handleProfile);
    passwordForm.removeEventListener('submit', handlePassword);
  };
}
