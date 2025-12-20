/**
 * Shell app routes
 * Routes handled directly by the shell (not in iframe)
 */
export const ShellRoutes = {
  index: '/',
  welcome: {
    index: '/welcome',
    accounts: '/welcome/accounts',
  },
  newSafe: {
    create: '/new-safe/create',
    load: '/new-safe/load',
  },
  notFound: '/404',
} as const

/**
 * Check if a route is handled by the shell
 */
export function isShellRoute(pathname: string): boolean {
  const shellPaths = [
    ShellRoutes.index,
    ShellRoutes.welcome.index,
    ShellRoutes.welcome.accounts,
    ShellRoutes.newSafe.create,
    ShellRoutes.newSafe.load,
    ShellRoutes.notFound,
  ]

  return shellPaths.some((path) => pathname === path || pathname.startsWith(path + '/'))
}
