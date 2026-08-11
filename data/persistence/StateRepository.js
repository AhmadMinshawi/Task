import { importLegacyJobs } from './LegacyImporter.js';

const TABLE = 'taskv_state_v2';
const COLLECTIONS = ['clients','projects','tasks','payments','deliveries','expenses','activities'];

function loadedState(state, currentUserId) {
  const safe = { ...structuredClone(state ?? {}), session: { userId: currentUserId } };
  for (const collection of COLLECTIONS) if (!Array.isArray(safe[collection])) safe[collection] = [];
  return safe;
}

function dataCounts(state) {
  return ['clients','projects','tasks','payments','deliveries','expenses','activities']
    .reduce((sum, key) => sum + (Array.isArray(state?.[key]) ? state[key].length : 0), 0);
}

export function createStateRepository(supabase) {
  let revision = null;
  let remotePayload = null;
  let userId = null;

  async function load(currentUserId) {
    userId = currentUserId;
    const { data, error } = await supabase
      .from(TABLE)
      .select('payload,schema_version,revision,updated_at')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      revision = 0;
      remotePayload = {};
      return {
        session: { userId: currentUserId },
        clients: [], projects: [], tasks: [], payments: [], deliveries: [], expenses: [], activities: []
      };
    }

    revision = Number(data.revision) || 1;
    remotePayload = structuredClone(data.payload ?? {});

    if (remotePayload.state && typeof remotePayload.state === 'object') {
      return loadedState(remotePayload.state, currentUserId);
    }

    if (Array.isArray(remotePayload.legacy_jobs)) {
      return loadedState(importLegacyJobs(currentUserId, remotePayload.legacy_jobs), currentUserId);
    }

    return {
      session: { userId: currentUserId },
      clients: [], projects: [], tasks: [], payments: [], deliveries: [], expenses: [], activities: []
    };
  }

  async function save(state) {
    if (!userId) throw new Error('StateRepository must load before save');
    if (state?.session?.userId !== userId) throw new Error('State owner mismatch');
    if (revision === null) throw new Error('Unknown remote revision');

    const nextState = structuredClone(state);
    delete nextState.session;

    const localCount = dataCounts(nextState);
    const remoteState = remotePayload?.state;
    const remoteCount = dataCounts(remoteState);

    if (remoteCount > 0 && localCount === 0) {
      throw new Error('Safety stop: refusing to overwrite non-empty remote state with empty data');
    }

    const nextPayload = {
      ...(remotePayload ?? {}),
      state: nextState,
      schema: 'taskv_state_v2',
      last_saved_at: new Date().toISOString()
    };

    if (revision === 0) {
      const { data, error } = await supabase.from(TABLE).insert({
        user_id: userId,
        payload: nextPayload,
        schema_version: 2,
        revision: 1,
        updated_at: new Date().toISOString()
      }).select('payload,revision').single();
      if (error) throw error;
      remotePayload = structuredClone(data.payload);
      revision = Number(data.revision);
      return revision;
    }

    const expected = revision;
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        payload: nextPayload,
        revision: expected + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('revision', expected)
      .select('payload,revision')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Save conflict: remote data changed. Reload before saving again.');

    remotePayload = structuredClone(data.payload);
    revision = Number(data.revision);
    return revision;
  }

  function currentRevision() { return revision; }

  return Object.freeze({ load, save, currentRevision });
}
