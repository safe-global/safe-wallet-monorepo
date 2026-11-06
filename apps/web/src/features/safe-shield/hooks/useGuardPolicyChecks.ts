import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useMemoDeepCompare } from '@safe-global/utils/features/safe-shield/hooks/util-hooks/useMemoDeepCompare'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  decodeGuardCheckFailure,
  encodeGuardCheck,
  type GuardCheckResult,
  type GuardCheckTransaction,
} from '@safe-global/utils/services/policy-guard'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useHasFeature } from '@/hooks/useChains'
import { logError } from '@/services/exceptions'
import { extractRevertData } from '@/utils/customErrorRegistry'
import { isRateLimitError } from '@/utils/transaction-errors'
import { isPolicyGuard } from '@/features/policy-guard/services'

export type GuardPolicyCheck = {
  blocked?: GuardCheckResult
  isAllowed: boolean
}

type Verdict = { calls: GuardCheckTransaction[]; blocked?: GuardCheckResult }

const DEBOUNCE_MS = 500

/**
 * Simulates the guard's checkTransaction per call, with the Safe as caller, and returns the first refusal.
 * Neither flag is set until there is a verdict for the current calls; a call the guard can't judge gives none.
 */
export const useGuardPolicyChecks = (calls: GuardCheckTransaction[] | undefined): GuardPolicyCheck => {
  const { safeAddress, safe } = useSafeInfo()
  const provider = useWeb3ReadOnly()
  const isEnabled = useHasFeature(FEATURES.POLICY_RECIPIENT_ALLOWLIST) === true
  const guard = safe?.guard?.value

  const currentCalls = useMemoDeepCompare(() => calls, [calls])
  const checkedCalls = useDebounce(currentCalls, DEBOUNCE_MS)
  const isApplicable = isEnabled && isPolicyGuard(guard) && !!safeAddress && !!currentCalls?.length

  const [verdict] = useAsync<Verdict | undefined>(async () => {
    if (!isApplicable || !guard || !provider || !checkedCalls?.length) return undefined

    for (const call of checkedCalls) {
      try {
        await provider.call({ from: safeAddress, to: guard, data: encodeGuardCheck(call) })
      } catch (error) {
        const blocked = decodeGuardCheckFailure(extractRevertData(error))
        if (blocked.status !== 'unknown') return { calls: checkedCalls, blocked }

        if (!isRateLimitError(error)) logError(ErrorCodes._656, error)
        return undefined
      }
    }

    return { calls: checkedCalls }
  }, [isApplicable, checkedCalls, provider, safeAddress, guard])

  const current = isApplicable && verdict?.calls === currentCalls ? verdict : undefined

  return { blocked: current?.blocked, isAllowed: !!current && !current.blocked }
}
