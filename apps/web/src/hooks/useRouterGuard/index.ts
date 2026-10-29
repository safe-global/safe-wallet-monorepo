import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { getWelcomeRoute } from '@/utils/getWelcomeRoute'

export type ActivationGuard = () => Promise<{ success: boolean; redirectTo?: string }>
export type UseGuard = () => {
  activationGuard: ActivationGuard
}

// ---------------------------------------------------------------------------
// Global store for isCheckingAccess — any component can subscribe via the hook
// ---------------------------------------------------------------------------

const { setStore: setIsCheckingAccess, useStore: useIsCheckingAccess } = new ExternalStore<boolean>(true)

export { useIsCheckingAccess }

// ---------------------------------------------------------------------------

interface useRouterGuardProps {
  useGuard: UseGuard
}

export const useRouterGuard = ({ useGuard }: useRouterGuardProps) => {
  const router = useRouter()
  const { activationGuard } = useGuard()
  const isCheckingAccess = useIsCheckingAccess()
  const allowedPathnameRef = useRef<string | undefined>(undefined)
  // The router object changes on every route render, so the check reads it from a ref instead of depending on it
  const routerRef = useRef(router)
  const { pathname } = router

  useEffect(() => {
    routerRef.current = router
  })

  useEffect(() => {
    // Runs can overlap and settle out of order, so a superseded one must not record or redirect
    let cancelled = false

    const checkAccess = async () => {
      // A re-check of an allowed page runs in the background: disabling the page again drops a click in progress
      if (allowedPathnameRef.current !== pathname) {
        setIsCheckingAccess(true)
      }

      const { success, redirectTo } = await activationGuard()
      if (cancelled) return

      if (success) {
        allowedPathnameRef.current = pathname
        setIsCheckingAccess(false)
      } else {
        // we do not want to set isCheckingAccess to false here because we want
        // the checking access to be reseted only after the redirect is done
        allowedPathnameRef.current = undefined
        routerRef.current.replace(redirectTo ?? getWelcomeRoute())
      }
    }

    checkAccess()

    return () => {
      cancelled = true
    }
  }, [activationGuard, pathname])

  return { isCheckingAccess }
}
