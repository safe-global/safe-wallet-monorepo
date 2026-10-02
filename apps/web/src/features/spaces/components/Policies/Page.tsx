import { useRouter } from 'next/router'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
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

const LOCKED_POLICIES: PolicyId[] = ['spending-limit', 'proposer']

const SpacePolicies = ({ spaceId }: { spaceId: string }) => {
  const router = useRouter()
  const { policies, isLoading, isError, refetch } = useSpacePolicies()
  // The page follows the plan alone; the per-feature gating flags only apply to the Safe settings.
  const planGate = usePlanGate(FEATURES.SAFE_PRO)
  const isLocked = planGate.mustUpgradeToSafePro

  const { tierName, isLoading: isPlanLoading } = useSpacePlan(isLocked ? spaceId : null)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId })

  return (
    <Policies
      // Closes an open panel on a Space switch.
      key={spaceId}
      policies={policies}
      isLoading={isLoading || planGate.isLoading || (isLocked && isPlanLoading)}
      isError={isError}
      onRetry={refetch}
      locked={
        isLocked
          ? {
              planName: tierName ?? 'Safe Pro',
              workspaceName: space?.name ?? '',
              lockedPolicies: LOCKED_POLICIES,
              onUpgrade: () => void router.push(planGate.upgradeHref),
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
      <AddressBookSourceProvider source="merged">
        <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
          <SpacePolicies spaceId={spaceId} />
        </div>
      </AddressBookSourceProvider>
    </AuthState>
  )
}
