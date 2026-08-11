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

assert.equal(exists('domains/projects/ProjectManager.js'), false, 'legacy ProjectManager must be removed');
assert.equal(exists('domains/expenses/ExpenseManager.js'), false, 'legacy ExpenseManager must be removed');
assert.equal(exists('security/rls.sql'), false, 'duplicate RLS source must be removed');
assert.equal(exists('security/supabase_rls.sql'), true, 'canonical RLS source must exist');

const sourceFiles = allFiles('.').filter(file => (file.endsWith('.js') || file.endsWith('.sql')) && !file.endsWith('tests/architecture-audit.js'));
const source = sourceFiles.map(file => read(file)).join('\n');
assert.equal(source.includes('ProjectManager'), false, 'no source reference to ProjectManager');
assert.equal(source.includes('ExpenseManager'), false, 'no source reference to ExpenseManager');
assert.equal(source.includes("security/rls.sql"), false, 'no source reference to duplicate rls.sql');

const bootstrap = read('core/bootstrap.js');
assert.equal(bootstrap.includes("register('FinanceEngine'"), true);
assert.equal(bootstrap.includes("register('FinanceManager'"), true);
assert.equal(bootstrap.indexOf("register('FinanceEngine'") < bootstrap.indexOf("register('FinanceManager'"), true);
assert.equal(bootstrap.includes('MemoryAdapter'), false, 'production bootstrap must not use memory fallback');

for (const file of [
  'ui/components/forms/ProjectForm.js',
  'ui/components/forms/ClientForm.js',
  'ui/components/forms/TaskForm.js',
  'ui/components/settings/ArchivePanel.js',
  'ui/components/settings/TrashPanel.js'
]) assert.equal(exists(file), true, `${file} must remain an extracted UI module`);

assert.equal(exists('domains/projects/ProjectStatus.js'), true, 'project lifecycle rules must remain outside the UI');
assert.equal(read('data/persistence/PersistenceManager.js').includes('app.state.subscribe'), true, 'persistence must observe all state mutations');
assert.equal(read('data/persistence/StateRepository.js').includes('loadedState'), true, 'remote state must be normalized before use');

for (const [view, form] of [
  ['ui/components/ProjectsView.js', './forms/ProjectForm.js'],
  ['ui/components/ClientsView.js', './forms/ClientForm.js'],
  ['ui/components/TasksView.js', './forms/TaskForm.js']
]) assert.equal(read(view).includes(form), true, `${view} must delegate its form`);

assert.equal(read('ui/components/SettingsView.js').split('\n').length < 80, true, 'SettingsView must stay an orchestration component');

const rls = read('security/supabase_rls.sql');
for (const table of ['clients','projects','tasks','payments','deliveries','expenses','activities']) {
  assert.equal(rls.includes(`public.${table}`), true, `${table} missing from canonical RLS`);
  assert.equal(rls.includes(`"taskv_${table}_owner"`), true, `${table} policy missing`);
}

console.log('Architecture cleanup audit: PASS');

// Phase 9: dead storage placeholders must not exist.
for (const file of [
  'data/adapters/MemoryAdapter.js',
  'data/adapters/SupabaseAdapter.js',
  'data/adapters/StorageAdapter.js',
  'security/initializeSupabase.js'
]) {
  assert.equal(exists(file), false, `${file} must be removed until it has a real runtime path`);
}

const jsSourceFiles = allFiles('.').filter(file => file.endsWith('.js') && !file.endsWith('tests/architecture-audit.js'));
const jsSource = jsSourceFiles.map(file => read(file)).join('\n');
for (const symbol of ['MemoryAdapter','SupabaseAdapter','StorageAdapter','initializeSupabase']) {
  assert.equal(jsSource.includes(symbol), false, `dead storage symbol still referenced: ${symbol}`);
}

assert.equal(bootstrap.includes("register('MutationGuard'"), true, 'MutationGuard must be registered');
for (const service of ['ProjectService','ClientService','TaskService','FinanceService','ExpenseService']) {
  assert.equal(
    bootstrap.indexOf("register('MutationGuard'") < bootstrap.indexOf(`register('${service}'`),
    true,
    `MutationGuard must be registered before ${service}`
  );
}

for (const [file, service] of [
  ['domains/projects/ProjectService.js','ProjectService'],
  ['domains/clients/ClientService.js','ClientService'],
  ['domains/tasks/TaskService.js','TaskService'],
  ['domains/finance/FinanceService.js','FinanceService'],
  ['domains/expenses/ExpenseService.js','ExpenseService']
]) {
  assert.equal(
    read(file).includes(`guard.assertManager('${service}')`),
    true,
    `${service} does not invoke MutationGuard`
  );
}
