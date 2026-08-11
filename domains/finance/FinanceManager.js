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
      state.payments.filter(x => !x.deletedAt && !x.archivedAt),
      state.expenses.filter(x => !x.deletedAt && !x.archivedAt),
      month
    );
  }

  function portfolioSummary(month = new Date().toISOString().slice(0, 7)) {
    const state = app.state.get();
    const projects = state.projects.filter(x => !x.deletedAt && !x.archivedAt);
    const payments = state.payments.filter(x => !x.deletedAt && !x.archivedAt);
    const deliveries = state.deliveries.filter(x => !x.deletedAt && !x.archivedAt);
    const monthly = engine.monthly(
      payments,
      state.expenses.filter(x => !x.deletedAt && !x.archivedAt),
      month
    );

    const totals = projects.reduce((summary, project) => {
      const finance = engine.project(
        project,
        payments.filter(x => x.projectId === project.id),
        deliveries.filter(x => x.projectId === project.id)
      );
      summary.projectValue += finance.grossProjectValue;
      summary.allTimeCollected += finance.paid;
      summary.outstanding += Math.max(finance.grossProjectValue - finance.paid, 0);
      return summary;
    }, { projectValue: 0, allTimeCollected: 0, outstanding: 0 });

    return Object.freeze({ ...monthly, ...totals });
  }

  return Object.freeze({ projectSummary, monthlySummary, portfolioSummary });
}
