import { useRouter } from 'next/router'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import AuthState from '../AuthState'
import { usePlanGate } from '../../hooks/usePlanGate'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useSpacePolicies } from './hooks/useSpacePolicies'
import type { PolicyId } from './PolicyCatalogue/catalogue'
import Policies from './index'

const SpacePolicies = ({ spaceId }: { spaceId: string }) => {
  const router = useRouter()
  const { policies, isLoading, isError, refetch } = useSpacePolicies()
  const spendingLimitGate = usePlanGate(FEATURES.SPENDING_LIMIT_GATING)
  const proposerGate = usePlanGate(FEATURES.PROPOSER_GATING)

  const lockedPolicies: PolicyId[] = []
  if (spendingLimitGate.mustUpgradeToSafePro) lockedPolicies.push('spending-limit')
  if (proposerGate.mustUpgradeToSafePro) lockedPolicies.push('proposer')
  const isLocked = lockedPolicies.length > 0

  const { tierName, isLoading: isPlanLoading } = useSpacePlan(isLocked ? spaceId : null)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId })

  return (
    <Policies
      policies={policies}
      isLoading={isLoading || spendingLimitGate.isLoading || proposerGate.isLoading || (isLocked && isPlanLoading)}
      isError={isError}
      onRetry={refetch}
      locked={
        isLocked
          ? {
              planName: tierName ?? 'Safe Pro',
              workspaceName: space?.name ?? '',
              lockedPolicies,
              onUpgrade: () => void router.push(spendingLimitGate.upgradeHref),
            }
          : undefined
      }
    />
  )
}

export default function SpacePoliciesPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <SpacePolicies spaceId={spaceId} />
      </div>
    </AuthState>
  )
}
