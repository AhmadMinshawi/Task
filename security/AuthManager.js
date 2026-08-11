export function createAuthManager(app, supabase) {
  let currentUser = null;

  function applyUser(user) {
    currentUser = user ? Object.freeze({
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.name ?? ''
    }) : null;

    app.state.setSession(currentUser ? {
      userId: currentUser.id,
      email: currentUser.email,
      name: currentUser.name
    } : null);

    app.events.emit('auth.changed', currentUser);
    return currentUser;
  }

  async function applySession(session) {
    return applyUser(session?.user ?? null);
  }

  async function restore() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    await applySession(data.session);
    return currentUser;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await applySession(data.session);
    return currentUser;
  }

  async function signUp(email, password, name = '') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    if (data.session) await applySession(data.session);
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await applySession(null);
  }

  async function updateProfile({ name = '', email = '' }) {
    const nextName = String(name).trim();
    const nextEmail = String(email).trim();
    if (!nextName) throw new Error('Name is required.');
    if (!nextEmail) throw new Error('Email is required.');
    const attributes = { data: { name: nextName } };
    if (nextEmail !== currentUser?.email) attributes.email = nextEmail;
    const { data, error } = await supabase.auth.updateUser(attributes);
    if (error) throw error;
    return applyUser(data.user);
  }

  async function updatePassword(currentPassword, password) {
    if (String(password).length < 8) throw new Error('Use at least 8 characters.');
    const { data, error } = await supabase.auth.updateUser({ current_password: String(currentPassword), password: String(password) });
    if (error) throw error;
    return applyUser(data.user);
  }

  function user() { return currentUser; }
  function isAuthenticated() { return Boolean(currentUser?.id); }

  return Object.freeze({
    restore,
    applySession,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    user,
    isAuthenticated
  });
}
