// Jest 30 adds "node" to require() conditions; Jest 29 didn't, and TanStack Router picks its server build on "node"
module.exports = (path, options) =>
  options.defaultResolver(path, { ...options, conditions: options.conditions?.filter((c) => c !== 'node') })
