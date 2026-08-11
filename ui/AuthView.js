export function renderAuthView(root, auth, onAuthenticated) {
  root.innerHTML = `
    <main class="auth-shell">
      <section class="auth-card">
        <div class="auth-brand"><div class="brand-mark">T</div><div><strong>TaskV</strong><small>Secure workspace</small></div></div>
        <h1>Sign in</h1>
        <p>Use your TaskV account to continue.</p>
        <form data-signin>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
          <button type="submit">Sign in</button>
          <p class="form-error" data-error></p>
        </form>
      </section>
    </main>`;

  const form = root.querySelector('[data-signin]');
  const error = root.querySelector('[data-error]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      await auth.signIn(values.email, values.password);
      await onAuthenticated();
    } catch (err) {
      error.textContent = err.message || 'Could not sign in.';
    }
  });
}
