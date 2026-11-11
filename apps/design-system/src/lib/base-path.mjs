/** `''` or `/segment`, without a trailing slash; shared by next.config.mjs and src/lib/env.ts */
export const normaliseBasePath = (value) => {
  const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : ''
}
