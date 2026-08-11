export function createAuthManager(app, supabase) {
  let currentUser = null;

  async function applySession(session) {
    const user = session?.user ?? null;
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

  function user() { return currentUser; }
  function isAuthenticated() { return Boolean(currentUser?.id); }

  return Object.freeze({
    restore,
    applySession,
    signIn,
    signUp,
    signOut,
    user,
    isAuthenticated
  });
}
