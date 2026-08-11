import { EventBus } from './events.js';
import { AppState } from './state.js';
import { ManagerRegistry } from './registry.js';

export function createApp() {
  const events = new EventBus();
  const state = new AppState({
    session: null,
    clients: [],
    projects: [],
    tasks: [],
    payments: [],
    deliveries: [],
    expenses: [],
    activities: []
  });

  const managers = new ManagerRegistry();

  return { events, state, managers };
}
