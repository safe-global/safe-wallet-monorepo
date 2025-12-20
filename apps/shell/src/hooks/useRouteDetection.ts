import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { isShellRoute } from '@/config/routes'

export type RouteMode = 'shell' | 'iframe'

export interface RouteDetection {
  mode: RouteMode
  safeAddress: string | null
  chainPrefix: string | null
}

/**
 * Detects whether to render shell content or account app iframe
 *
 * Rules:
 * 1. If query param ?safe=chain:0x... exists -> iframe mode
 * 2. If route is in SHELL_ROUTES -> shell mode
 * 3. Otherwise -> iframe mode (for future account routes)
 *
 * @returns Route detection information
 */
export function useRouteDetection(): RouteDetection {
  const router = useRouter()

  return useMemo(() => {
    const safeParam = router.query.safe as string | undefined

    // Check for ?safe=chain:0x... query parameter
    if (safeParam && safeParam.includes(':')) {
      const parts = safeParam.split(':')
      if (parts.length === 2 && parts[1]?.startsWith('0x')) {
        return {
          mode: 'iframe',
          chainPrefix: parts[0],
          safeAddress: parts[1],
        }
      }
    }

    // Check if current path is a shell-only route
    if (isShellRoute(router.pathname)) {
      return {
        mode: 'shell',
        safeAddress: null,
        chainPrefix: null,
      }
    }

    // Default to iframe for unknown routes (future account app routes)
    return {
      mode: 'iframe',
      safeAddress: null,
      chainPrefix: null,
    }
  }, [router.query.safe, router.pathname])
}
