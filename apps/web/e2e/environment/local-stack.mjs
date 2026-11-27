export const chainProfiles = { 1: 'mainnet', 137: 'polygon' }

/** Returns `value` without a trailing slash; throws unless it is a plain HTTP URL on this machine. */
export function localUrl(value, label) {
  const url = new URL(value)
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.username || url.password) {
    throw new Error(`${label} must point to the local stack`)
  }
  return url.href.replace(/\/$/, '')
}

/** Compose project names are checked before any Docker command, so one run cannot touch another project. */
export function assertProjectName(project) {
  if (!/^safe-e2e-[a-z0-9-]+$/.test(project ?? '')) {
    throw new Error(`Invalid SAFE_E2E_PROJECT ${project}; use safe-e2e-<lowercase name>`)
  }
  return project
}
