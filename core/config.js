export const APP_CONFIG = Object.freeze({
  name: 'TaskV',
  version: 'V1',
  environment: 'development',
  dataSchemaVersion: 2,
  phase: 10,
  logo: { mark: 'T', background: 'blue' },
  persistence: Object.freeze({ provider: 'supabase', table: 'taskv_state_v2' })
});
