import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export type ActivationGuard = () => Promise<{ success: boolean; redirectTo?: string }>
export type UseGuard = () => {
  activationGuard: ActivationGuard
}

interface useRouterGuardProps {
  useGuard: UseGuard
}

export const useRouterGuard = ({ useGuard }: useRouterGuardProps) => {
  const router = useRouter()
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const { activationGuard } = useGuard()

  useEffect(() => {
    const checkAccess = async () => {
      setIsCheckingAccess(true)

      const { success, redirectTo } = await activationGuard()


      if (success) {
        setIsCheckingAccess(false)
      } else {
        // we do not want to set isCheckingAccess to false here because we want
        // the checking access to be reseted only after the redirect is done
        router.replace(redirectTo ?? AppRoutes.welcome.index)
      }
    }

    checkAccess()
  }, [activationGuard, router])

  return { isCheckingAccess }
}
