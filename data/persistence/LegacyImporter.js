function iso(value) {
  if (!value) return new Date(0).toISOString();
  const n = Number(value);
  if (Number.isFinite(n) && n > 100000000000) return new Date(n).toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(Math.max(0, n) * 100) / 100 : 0;
}

function qty(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function importLegacyJobs(userId, jobs = []) {
  const clients = [];
  const projects = [];
  const tasks = [];
  const payments = [];
  const deliveries = [];
  const expenses = [];
  const activities = [];
  const clientsByName = new Map();

  for (const job of Array.isArray(jobs) ? jobs : []) {
    const clientName = String(job?.client ?? '').trim() || 'Unnamed client';
    const key = clientName.toLocaleLowerCase();
    let client = clientsByName.get(key);

    if (!client) {
      client = {
        id: `client_${job.id}`,
        ownerId: userId,
        name: clientName,
        email: '',
        phone: '',
        industry: '',
        archivedAt: null,
        createdAt: iso(job.createdAt),
        updatedAt: iso(job.updatedAt),
        deletedAt: null
      };
      clientsByName.set(key, client);
      clients.push(client);
    }

    projects.push({
      id: String(job.id),
      ownerId: userId,
      clientId: client.id,
      name: clientName,
      pricePerVideo: money(job.pricePerVideo),
      totalVideos: qty(job.totalVideos),
      pinned: Boolean(job.pinned),
      archivedAt: null,
      status: ({ progress: 'in_progress', active: 'in_progress', done: 'completed' })[job.projectStatus] || job.projectStatus || 'new',
      notes: job.notes ?? '',
      deadline: job.deadline ?? '',
      projectLink: job.projectLink ?? '',
      createdAt: iso(job.createdAt),
      updatedAt: iso(job.updatedAt),
      deletedAt: null
    });

    for (const task of Array.isArray(job.taskList) ? job.taskList : []) {
      tasks.push({
        id: task.id ?? crypto.randomUUID(),
        ownerId: userId,
        projectId: String(job.id),
        title: String(task.text ?? '').trim(),
        status: task.done ? 'done' : 'todo',
        dueDate: task.due || null,
        archivedAt: null,
        createdAt: iso(task.createdAt ?? job.createdAt),
        updatedAt: iso(task.updatedAt ?? job.updatedAt),
        deletedAt: null
      });
    }

    for (const payment of Array.isArray(job.payments) ? job.payments : []) {
      payments.push({
        id: payment.id ?? `payment_${job.id}_${payment.createdAt ?? payments.length}`,
        ownerId: userId,
        projectId: String(job.id),
        amount: money(payment.amount),
        title: payment.title ?? 'Payment',
        date: payment.date || iso(payment.createdAt),
        archivedAt: null,
        createdAt: iso(payment.createdAt ?? job.createdAt),
        updatedAt: iso(payment.updatedAt ?? job.updatedAt),
        deletedAt: null
      });
    }

    for (const delivery of Array.isArray(job.delivered) ? job.delivered : []) {
      deliveries.push({
        id: delivery.id ?? `delivery_${job.id}_${delivery.createdAt ?? deliveries.length}`,
        ownerId: userId,
        projectId: String(job.id),
        quantity: qty(delivery.count),
        title: delivery.title ?? 'Delivery',
        date: delivery.date || iso(delivery.createdAt),
        archivedAt: null,
        createdAt: iso(delivery.createdAt ?? job.createdAt),
        updatedAt: iso(delivery.updatedAt ?? job.updatedAt),
        deletedAt: null
      });
    }

    for (const expense of Array.isArray(job.expenses) ? job.expenses : []) {
      expenses.push({
        id: expense.id ?? `expense_${job.id}_${expense.createdAt ?? expenses.length}`,
        ownerId: userId,
        projectId: String(job.id),
        amount: money(expense.amount),
        title: expense.title ?? expense.name ?? 'Expense',
        date: expense.date || iso(expense.createdAt),
        archivedAt: null,
        createdAt: iso(expense.createdAt ?? job.createdAt),
        updatedAt: iso(expense.updatedAt ?? job.updatedAt),
        deletedAt: null
      });
    }

    for (const activity of Array.isArray(job.activityLog) ? job.activityLog : []) {
      activities.push({
        id: activity.id ?? crypto.randomUUID(),
        ownerId: userId,
        projectId: String(job.id),
        type: activity.type ?? 'activity',
        details: activity.details ?? '',
        createdAt: iso(activity.at)
      });
    }
  }

  return {
    session: { userId },
    clients,
    projects,
    tasks,
    payments,
    deliveries,
    expenses,
    activities
  };
}
