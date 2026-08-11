export class MigrationManager {
  constructor({ currentVersion, migrations = [] }) {
    this.currentVersion = currentVersion;
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
  }

  plan(fromVersion) {
    return this.migrations.filter(m =>
      m.version > fromVersion && m.version <= this.currentVersion
    );
  }

  validatePlan(fromVersion) {
    const plan = this.plan(fromVersion);
    let expected = fromVersion + 1;
    for (const migration of plan) {
      if (migration.version !== expected) {
        throw new Error(`Migration gap: expected V${expected}, found V${migration.version}`);
      }
      expected++;
    }
    return plan;
  }

  async migrate(snapshot, fromVersion) {
    const plan = this.validatePlan(fromVersion);
    let next = structuredClone(snapshot);
    for (const migration of plan) {
      next = await migration.up(next);
    }
    return next;
  }
}
