const EXACT_EXCLUDED: ReadonlyArray<string> = [
  '/imprint',
  '/privacy',
  '/cookie',
  '/terms',
  '/licenses',
  '/safe-labs-terms',
  '/404',
  '/403',
  '/hypernative/oauth-callback',
]

const PREFIX_EXCLUDED: ReadonlyArray<string> = ['/welcome', '/share', '/import', '/oidc', '/new-safe']

export const isExcludedRoute = (pathname: string): boolean => {
  if (!pathname) return false
  if (EXACT_EXCLUDED.includes(pathname)) return true
  return PREFIX_EXCLUDED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
