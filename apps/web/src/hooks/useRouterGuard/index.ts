import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ExternalStore from '@safe-global/utils/services/ExternalStore'

export type ActivationGuard = () => Promise<{ success: boolean; redirectTo?: string }>
export type UseGuard = (evaluateGuard: (ctx: GuardContext) => GuardResult) => {
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

  useEffect(() => {
    const checkAccess = async () => {
      setIsCheckingAccess(true)

      const { success, redirectTo } = await activationGuard()

      if (success) {
        setIsCheckingAccess(false)
      } else {
        // we do not want to set isCheckingAccess to false here because we want
        // the checking access to be reseted only after the redirect is done
        console.log('## caiu no redirect', redirectTo)
        router.replace(redirectTo ?? AppRoutes.welcome.index)
      }
    }

    checkAccess()
  }, [activationGuard, router])

  return { isCheckingAccess }
}
