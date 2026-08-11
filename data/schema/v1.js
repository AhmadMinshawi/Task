export const DATA_SCHEMA_V1 = Object.freeze({
  users: ['id', 'email', 'createdAt'],
  clients: ['id', 'ownerId', 'name', 'email', 'phone', 'industry', 'createdAt', 'updatedAt', 'deletedAt'],
  projects: ['id', 'ownerId', 'clientId', 'name', 'pricePerVideo', 'totalVideos', 'pinned', 'createdAt', 'updatedAt', 'deletedAt'],
  tasks: ['id', 'ownerId', 'projectId', 'title', 'status', 'dueDate', 'createdAt', 'updatedAt', 'deletedAt'],
  payments: ['id', 'ownerId', 'projectId', 'amount', 'date', 'title', 'createdAt', 'updatedAt', 'deletedAt'],
  deliveries: ['id', 'ownerId', 'projectId', 'quantity', 'date', 'title', 'createdAt', 'updatedAt', 'deletedAt'],
  expenses: ['id', 'ownerId', 'amount', 'title', 'date', 'createdAt', 'updatedAt', 'deletedAt'],
  activities: ['id', 'ownerId', 'type', 'entityType', 'entityId', 'createdAt']
});
