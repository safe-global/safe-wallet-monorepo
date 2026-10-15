import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import {
  classifyGuardAction,
  decodeGuardCheckFailure,
  encodeGuardCheck,
  isGuardSelfCall,
  isKnownPolicyGuard,
  type GuardAction,
  type GuardCheckResult,
  type GuardCheckTransaction,
} from '@safe-global/utils/services/policy-guard'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useSafeInfo from '@/hooks/useSafeInfo'

export type GuardPolicyCheck = {
  /** The first call the guard would refuse, if any. Absent when everything passes. */
  blocked?: { result: GuardCheckResult; action: GuardAction; call: GuardCheckTransaction }
  /** True once every call has been checked and none is refused. */
  isAllowed: boolean
  /** False when the Safe runs no recognised policy guard, so there is nothing to say. */
  isApplicable: boolean
  isLoading: boolean
}

/** The revert data an `eth_call` carries, wherever the provider puts it. */
const revertDataOf = (error: unknown): string | undefined => {
  const candidate = error as { data?: unknown; info?: { error?: { data?: unknown } } }
  const data = candidate?.data ?? candidate?.info?.error?.data
  return typeof data === 'string' ? data : undefined
}

/**
 * Whether the Safe's policy guard would let a transaction through, asked before it is signed.
 *
 * The guard's own `checkTransaction` hook is simulated with the Safe as the caller, which is how
 * the Safe invokes it. A successful call means every policy the transaction touches permits it;
 * a revert carries the verdict. Only a recognised SafePolicyGuard is asked — another guard's
 * behaviour is unknown, so no claim is made about it.
 *
 * Several calls are checked one by one rather than as the batch they will become: the batch is
 * only built once the flow leaves its form, and a policy refusing one call refuses the batch too,
 * since MultiSendPolicy re-checks every call inside it. That makes the blocked call nameable
 * while the user can still change it.
 */
export const useGuardPolicyChecks = (calls: GuardCheckTransaction[] | undefined): GuardPolicyCheck => {
  const { safeAddress, safe } = useSafeInfo()
  const provider = useWeb3ReadOnly()
  const guard = safe?.guard?.value
  const isGuardEnabled = isKnownPolicyGuard(guard) && !!safeAddress

  // Managing the Safe's own policies bypasses them by design, so there is no verdict to report.
  const governedCalls = calls?.filter((call) => !isGuardSelfCall(call, guard))
  const isApplicable = isGuardEnabled && !!governedCalls?.length

  // Calls are rebuilt as the form changes; their contents are what the check depends on.
  const callsKey = governedCalls?.length ? JSON.stringify(governedCalls) : undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkedCalls = useMemo(() => governedCalls, [callsKey])

  const [blocked, , isLoading] = useAsync<GuardPolicyCheck['blocked'] | undefined>(async () => {
    if (!isApplicable || !checkedCalls?.length || !provider) return undefined

    for (const call of checkedCalls) {
      try {
        await provider.call({ from: safeAddress, to: guard as string, data: encodeGuardCheck(call) })
      } catch (error) {
        // A revert is the answer here, not a failure: the guard reverts to refuse a transaction.
        const result = decodeGuardCheckFailure(revertDataOf(error))
        // An unreadable verdict is not a refusal; keep checking the rest.
        if (result.status === 'unknown' || result.status === 'allowed') continue
        return { result, action: classifyGuardAction(call, safeAddress), call }
      }
    }

    return undefined
  }, [isApplicable, checkedCalls, provider, safeAddress, guard])

  const isChecking = isApplicable && !!checkedCalls?.length && isLoading

  return {
    blocked,
    isAllowed: isApplicable && !!checkedCalls?.length && !isChecking && !blocked,
    isApplicable,
    isLoading: isChecking,
  }
}
