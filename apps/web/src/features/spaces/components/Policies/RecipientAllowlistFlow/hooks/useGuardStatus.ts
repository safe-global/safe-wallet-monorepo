import { usePolicyGuard } from '@/features/policy-guard'
import type { PolicyGuardTarget } from '@/features/policy-guard/types'
import type { GuardStatus } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'

/** The policy guard read of the picked Safe as one banner state; none until a Safe is picked. */
export const useGuardStatus = (target?: PolicyGuardTarget): { guard?: GuardStatus; retry: () => void } => {
  const { state, isLoading, isRetrying, error, refetch } = usePolicyGuard(target)

  if (!target) return { retry: refetch }
  if (state) return { guard: state, retry: refetch }
  if (error) return { guard: { status: isRetrying ? 'loading' : 'error' }, retry: refetch }
  if (isLoading) return { guard: { status: 'loading' }, retry: refetch }
  // A settled read with nothing to show means CGW has no such Safe: it is counterfactual
  return { guard: { status: 'not-activated' }, retry: refetch }
}
