import { useRouter } from 'next/compat/router'
import { AppRoutes } from '@/config/routes'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { useIsShellOn } from './scenario'
import { PREVIEW_ROUTE } from './shellPages'

const NO_SHELL_PREFIXES = [AppRoutes.welcome.index, '/new-safe', '/share', AppRoutes.spaces.createSpace]

/** Pages the Safe filter shell wraps: every Safe page, the Workspace pages, the account list and the stand-ins. */
export const isShellRoute = (pathname: string, hasSafe: boolean): boolean => {
  if (pathname === PREVIEW_ROUTE || pathname === AppRoutes.welcome.accounts) return true
  if (NO_SHELL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false
  return hasSafe || pathname === AppRoutes.spaces.index || pathname.startsWith(`${AppRoutes.spaces.index}/`)
}

/** The prototype shows the Safe filter shell on this page. Always false in production builds. */
export const useIsUnifiedShell = (): boolean => {
  const isOn = useIsShellOn()
  // The compat router is null where no router is mounted, as in a unit test.
  const pathname = useRouter()?.pathname ?? ''
  const safe = useSafeQueryParam()
  return isOn && isShellRoute(pathname, !!safe)
}
