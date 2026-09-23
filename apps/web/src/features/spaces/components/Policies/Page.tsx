import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import AuthState from '../AuthState'
import ChangePlanFlow from '../Plans/ChangePlanFlow'
import { usePolicyLock } from './hooks/usePolicyLock'
import { usePolicyUpgrade } from './hooks/usePolicyUpgrade'
import Policies from './index'

export default function SpacePoliciesPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const { isResolving, lock } = usePolicyLock(spaceId)
  const { pick, currentPlan, isOpen, open, close } = usePolicyUpgrade(spaceId)
  const hasFlow = pick !== undefined && currentPlan !== undefined

  // Without an offer to move to, the Plans page is the only place left to upgrade from.
  const onUpgrade = useCallback(() => {
    if (hasFlow) open()
    else void router.push({ pathname: AppRoutes.spaces.plans, query: { spaceId } })
  }, [hasFlow, open, router, spaceId])

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <Policies isLoading={isResolving} locked={lock && { ...lock, onUpgrade }} />

        {isOpen && pick && currentPlan && (
          <ChangePlanFlow spaceId={spaceId} pick={pick} currentPlan={currentPlan} onClose={close} />
        )}
      </div>
    </AuthState>
  )
}
