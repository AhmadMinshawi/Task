export function isActiveRecord(record) {
  return Boolean(record && !record.deletedAt && !record.archivedAt);
}

export function isArchivedRecord(record) {
  return Boolean(record && !record.deletedAt && record.archivedAt);
}

export function activeRecords(records = []) {
  return records.filter(isActiveRecord);
}

export function activeProjectRecords(records = [], projectId) {
  return records.filter(record => isActiveRecord(record) && record.projectId === projectId);
}
