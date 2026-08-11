export function createFinanceManager(app) {
  const engine = app.managers.get('FinanceEngine');

  function getProject(id) {
    return app.state.get().projects.find(p => p.id === id && !p.deletedAt);
  }

  function projectSummary(projectId) {
    const project = getProject(projectId);
    if (!project) throw new Error('Project not found');

    const state = app.state.get();
    return engine.project(
      project,
      state.payments.filter(x => x.projectId === projectId && !x.deletedAt),
      state.deliveries.filter(x => x.projectId === projectId && !x.deletedAt)
    );
  }

  function monthlySummary(month = new Date().toISOString().slice(0, 7)) {
    const state = app.state.get();
    return engine.monthly(
      state.payments.filter(x => !x.deletedAt),
      state.expenses.filter(x => !x.deletedAt),
      month
    );
  }

  return Object.freeze({ projectSummary, monthlySummary });
}
