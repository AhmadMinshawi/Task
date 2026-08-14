const runtimeEnvironment = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'development'
  : 'production';

export const APP_CONFIG = Object.freeze({
  name: 'TaskV',
  version: 'V1.0.0',
  environment: runtimeEnvironment,
  dataSchemaVersion: 2,
  phase: 12,
  logo: { mark: 'T', background: 'blue' },
  persistence: Object.freeze({ provider: 'supabase', table: 'taskv_state_v2' })
});
