export const DATA_SCHEMA_V1 = Object.freeze({
  users: ['id', 'email', 'createdAt'],
  clients: ['id', 'ownerId', 'name', 'email', 'phone', 'industry', 'profileLink', 'archivedAt', 'createdAt', 'updatedAt', 'deletedAt'],
  projects: ['id', 'ownerId', 'clientId', 'name', 'pricePerVideo', 'totalVideos', 'deadline', 'projectLink', 'status', 'pinned', 'archivedAt', 'createdAt', 'updatedAt', 'deletedAt'],
  tasks: ['id', 'ownerId', 'projectId', 'title', 'status', 'dueDate', 'amount', 'incomeDate', 'archivedAt', 'createdAt', 'updatedAt', 'deletedAt'],
  payments: ['id', 'ownerId', 'projectId', 'amount', 'date', 'title', 'archivedAt', 'createdAt', 'updatedAt', 'deletedAt'],
  deliveries: ['id', 'ownerId', 'projectId', 'quantity', 'date', 'title', 'archivedAt', 'createdAt', 'updatedAt', 'deletedAt'],
  expenses: ['id', 'ownerId', 'amount', 'title', 'date', 'archivedAt', 'createdAt', 'updatedAt', 'deletedAt'],
  activities: ['id', 'ownerId', 'type', 'entityType', 'entityId', 'createdAt']
});
