import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const allFiles = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const rel = path.join(dir, entry.name);
  return entry.isDirectory() ? allFiles(rel) : [rel];
});

for (const legacy of [
  'domains/projects/ProjectManager.js',
  'domains/expenses/ExpenseManager.js',
  'security/rls.sql',
  'data/adapters/MemoryAdapter.js',
  'data/adapters/SupabaseAdapter.js',
  'data/adapters/StorageAdapter.js',
  'security/initializeSupabase.js'
]) assert.equal(exists(legacy), false, `${legacy} must not exist`);

for (const required of [
  'domains/projects/ProjectIntegrity.js',
  'domains/projects/ProjectNoteService.js',
  'domains/projects/ProjectRelations.js',
  'ui/components/GlobalSearch.js',
  'ui/components/PersistenceStatus.js',
  'ui/components/FinanceReports.js',
  'ui/components/forms/ProjectNoteForm.js',
  'ui/utils/formatters.js',
  'security/supabase_rls.sql'
]) assert.equal(exists(required), true, `${required} must exist`);

const bootstrap = read('core/bootstrap.js');
assert.ok(bootstrap.includes("register('MutationGuard'"));
assert.ok(bootstrap.includes("register('FinanceEngine'"));
assert.ok(bootstrap.includes("register('FinanceManager'"));
assert.ok(bootstrap.includes("register('ProjectNoteService'"));
assert.ok(bootstrap.includes("register('DeadlineManager'"));
assert.ok(bootstrap.indexOf("register('FinanceEngine'") < bootstrap.indexOf("register('FinanceManager'"));
assert.equal(bootstrap.includes('MemoryAdapter'), false);

const shell = read('ui/AppShell.js');
for (const symbol of ['mountNotificationCenter', 'mountAccountMenu', 'mountGlobalSearch', 'mountPersistenceStatus']) {
  assert.ok(shell.includes(symbol), `AppShell must delegate ${symbol}`);
}
assert.ok(shell.indexOf("closest('.open-project, [data-open-project]')") < shell.indexOf("closest('button, input, select, textarea, a')"));

const workspace = read('ui/components/ProjectWorkspace.js');
assert.ok(workspace.includes('renderProjectFinancePanel'));
assert.ok(workspace.includes('openProjectNoteForm'));
assert.ok(workspace.includes('projectIntegrityIssues'));
assert.equal(workspace.includes('renderProjectTasksPanel'), false, 'V1.0.0 workspace no longer mounts ProjectTasksPanel');

const home = read('ui/components/HomeDashboard.js');
for (const feature of ['openProjectNoteForm', 'data-today-plan', 'dragstart', 'localDateKey']) {
  assert.ok(home.includes(feature), `HomeDashboard missing ${feature}`);
}

const financeView = read('ui/components/FinanceView.js');
assert.ok(financeView.includes('FinanceReports'));
const financeManager = read('domains/finance/FinanceManager.js');
for (const report of ['clientReports', 'projectReports', 'monthlyTrend']) assert.ok(financeManager.includes(report));

const persistence = read('data/persistence/PersistenceManager.js');
assert.ok(persistence.includes('app.state.subscribe'));
assert.ok(read('data/persistence/StateRepository.js').includes('loadedState'));

for (const [view, form] of [
  ['ui/components/ProjectsView.js', './forms/ProjectForm.js'],
  ['ui/components/ClientsView.js', './forms/ClientForm.js']
]) assert.ok(read(view).includes(form), `${view} must delegate its form`);

const jsFiles = allFiles('.').filter(file => file.endsWith('.js') && !file.endsWith('tests/architecture-audit.js'));
const jsSource = jsFiles.map(file => read(file)).join('\n');
for (const deadSymbol of ['ProjectManager', 'ExpenseManager', 'MemoryAdapter', 'SupabaseAdapter', 'StorageAdapter', 'initializeSupabase']) {
  assert.equal(jsSource.includes(deadSymbol), false, `dead symbol still referenced: ${deadSymbol}`);
}

const rls = read('security/supabase_rls.sql');
for (const table of ['clients','projects','tasks','payments','deliveries','expenses','activities']) {
  assert.ok(rls.includes(`public.${table}`), `${table} missing from canonical RLS`);
  assert.ok(rls.includes(`"taskv_${table}_owner"`), `${table} policy missing`);
}

console.log('Architecture V1.0.0 audit: PASS');
