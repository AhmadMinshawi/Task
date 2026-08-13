import { projectIsActive } from '../projects/ProjectRelations.js';
import { activeRecords, activeProjectRecords } from '../../core/recordState.js';

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
      activeProjectRecords(state.payments, projectId),
      activeProjectRecords(state.deliveries, projectId)
    );
  }

  function monthlySummary(month = new Date().toISOString().slice(0, 7)) {
    const state = app.state.get();
    return engine.monthly(
      activeRecords(state.payments),
      activeRecords(state.expenses),
      month
    );
  }

  function portfolioSummary(month = new Date().toISOString().slice(0, 7)) {
    const state = app.state.get();
    const projects = state.projects.filter(projectIsActive);
    const payments = activeRecords(state.payments);
    const deliveries = activeRecords(state.deliveries);
    const monthly = engine.monthly(
      payments,
      activeRecords(state.expenses),
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
      summary.outstanding += finance.outstandingAmount;
      return summary;
    }, { projectValue: 0, allTimeCollected: 0, outstanding: 0 });

    return Object.freeze({ ...monthly, ...totals });
  }

  function clientReports() {
    const state = app.state.get();
    const projects = state.projects.filter(projectIsActive);
    const payments = activeRecords(state.payments);
    const deliveries = activeRecords(state.deliveries);
    return activeRecords(state.clients).map(client => {
      const clientProjects = projects.filter(project => project.clientId === client.id);
      const totals = clientProjects.reduce((report, project) => {
        const finance = engine.project(
          project,
          payments.filter(payment => payment.projectId === project.id),
          deliveries.filter(delivery => delivery.projectId === project.id)
        );
        report.projectValue += finance.grossProjectValue;
        report.paid += finance.paid;
        report.outstanding += finance.outstandingAmount;
        report.deliveredVideos += finance.deliveredVideos;
        report.remainingVideos += finance.remainingProjectVideos;
        return report;
      }, { projectValue: 0, paid: 0, outstanding: 0, deliveredVideos: 0, remainingVideos: 0 });
      return Object.freeze({ client, projectCount: clientProjects.length, ...totals });
    }).filter(report => report.projectCount > 0).sort((a, b) => b.outstanding - a.outstanding || b.projectValue - a.projectValue);
  }

  function projectReports() {
    const state = app.state.get();
    const clients = new Map(activeRecords(state.clients).map(client => [client.id, client]));
    const payments = activeRecords(state.payments);
    const deliveries = activeRecords(state.deliveries);
    return state.projects.filter(projectIsActive).map(project => {
      const finance = engine.project(
        project,
        payments.filter(payment => payment.projectId === project.id),
        deliveries.filter(delivery => delivery.projectId === project.id)
      );
      return Object.freeze({
        project,
        client: clients.get(project.clientId) ?? null,
        ...finance,
        collectionRate: finance.hasFixedTotal && finance.grossProjectValue > 0 ? finance.paid / finance.grossProjectValue : finance.paid > 0 ? 1 : 0,
        deliveryRate: finance.hasFixedTotal
          ? finance.deliveredVideos / Number(project.totalVideos)
          : finance.coveredVideos > 0 ? finance.deliveredVideos / finance.coveredVideos : 0
      });
    }).sort((a, b) => b.outstandingAmount - a.outstandingAmount || b.grossProjectValue - a.grossProjectValue);
  }

  function monthlyTrend(count = 6, endingMonth = new Date().toISOString().slice(0, 7)) {
    const [year, month] = endingMonth.split('-').map(Number);
    return Array.from({ length: Math.max(1, count) }, (_, index) => {
      const date = new Date(Date.UTC(year, month - count + index, 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      return monthlySummary(key);
    });
  }

  return Object.freeze({ projectSummary, monthlySummary, portfolioSummary, clientReports, projectReports, monthlyTrend });
}
