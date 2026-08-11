export function createUIManager(app) {
  const registry = new Map();

  function register(name, controller) {
    if (registry.has(name)) throw new Error(`UI controller already registered: ${name}`);
    registry.set(name, controller);
    return controller;
  }

  function get(name) {
    const controller = registry.get(name);
    if (!controller) throw new Error(`UI controller not registered: ${name}`);
    return controller;
  }

  function destroy(name) {
    const controller = registry.get(name);
    if (controller?.destroy) controller.destroy();
    registry.delete(name);
  }

  function destroyAll() {
    for (const name of registry.keys()) destroy(name);
  }

  return Object.freeze({ app, register, get, destroy, destroyAll });
}
