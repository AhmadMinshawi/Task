import { APP_CONFIG } from './config.js';
import { createApp } from './app.js';
import { createRepositories } from '../data/repositories/RepositoryFactory.js';
import { createFinanceManager } from '../domains/finance/FinanceManager.js';
import { createSearchManager } from '../services/SearchManager.js';
import { createSecurityManager } from '../security/SecurityManager.js';
import { createAuthManager } from '../security/AuthManager.js';
import { createFinanceEngine } from '../domains/finance/FinanceEngine.js';
import { createExpenseService } from '../domains/expenses/ExpenseService.js';
import { createFinanceService } from '../domains/finance/FinanceService.js';
import { createProjectService } from '../domains/projects/ProjectService.js';
import { createClientService } from '../domains/clients/ClientService.js';
import { createTaskService } from '../domains/tasks/TaskService.js';
import { renderAppShell } from '../ui/AppShell.js';
import { renderAuthView } from '../ui/AuthView.js';
import { createMutationGuard } from './MutationGuard.js';
import { supabase } from '../security/supabaseClient.js';
import { createStateRepository } from '../data/persistence/StateRepository.js';
import { createPersistenceManager } from '../data/persistence/PersistenceManager.js';
import { createDeadlineManager } from '../services/DeadlineManager.js';

const app = createApp();
app.repositories = createRepositories(app);

app.managers.register('SecurityManager', createSecurityManager(app));
app.managers.register('AuthManager', createAuthManager(app, supabase));
app.managers.register('MutationGuard', createMutationGuard(app));
app.managers.register('FinanceEngine', createFinanceEngine());
app.managers.register('FinanceManager', createFinanceManager(app));
app.managers.register('ExpenseService', createExpenseService(app));
app.managers.register('FinanceService', createFinanceService(app));
app.managers.register('ProjectService', createProjectService(app));
app.managers.register('ClientService', createClientService(app));
app.managers.register('TaskService', createTaskService(app));
app.managers.register('SearchManager', createSearchManager(app));
app.managers.register('DeadlineManager', createDeadlineManager(app));

const stateRepository = createStateRepository(supabase);
app.managers.register('PersistenceManager', createPersistenceManager(app, stateRepository));
app.managers.get('PersistenceManager').watch();

const root = document.querySelector('#app');
const auth = app.managers.get('AuthManager');
const persistence = app.managers.get('PersistenceManager');
let launchedUserId = null;

async function launchAuthenticatedApp() {
  const user = auth.user();
  if (!user) return false;
  if (launchedUserId === user.id) return true;
  await persistence.load(user.id);
  launchedUserId = user.id;
  renderAppShell(root, app, APP_CONFIG);
  return true;
}

await auth.restore();
if (!(await launchAuthenticatedApp())) {
  renderAuthView(root, auth, launchAuthenticatedApp);
}

supabase.auth.onAuthStateChange((_event, session) => {
  void auth.applySession(session).then(async user => {
    if (user) await launchAuthenticatedApp();
    else {
      launchedUserId = null;
      renderAuthView(root, auth, launchAuthenticatedApp);
    }
  }).catch(error => console.error('[TaskV auth]', error));
});

window.TaskV = Object.freeze({ config: APP_CONFIG, ...app });
