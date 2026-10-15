import { useMemo } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import useAsync from '@safe-global/utils/hooks/useAsync'
import {
  classifyGuardAction,
  decodeGuardCheckFailure,
  encodeGuardCheck,
  isKnownPolicyGuard,
  type GuardAction,
  type GuardCheckResult,
} from '@safe-global/utils/services/policy-guard'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useSafeInfo from '@/hooks/useSafeInfo'

export type GuardPolicyCheck = {
  /** Absent when the Safe has no policy guard, so there is nothing to say. */
  result?: GuardCheckResult
  action?: GuardAction
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
 * the Safe invokes it. A successful call means every policy the transaction touches permits it; a
 * revert carries the verdict. Only a recognised SafePolicyGuard is asked — another guard's
 * behaviour is unknown, so no claim is made about it.
 */
export const useGuardPolicyCheck = (safeTx: SafeTransaction | undefined): GuardPolicyCheck => {
  const { safe, safeAddress } = useSafeInfo()
  const provider = useWeb3ReadOnly()
  const guard = safe?.guard?.value

  const request = useMemo(() => {
    if (!safeTx || !safeAddress || !isKnownPolicyGuard(guard)) return undefined

    const { to, value, data, operation = 0 } = safeTx.data
    return { guard: guard as string, from: safeAddress, tx: { to, value, data, operation } }
  }, [safeTx, safeAddress, guard])

  const [result, , isLoading] = useAsync<GuardCheckResult | undefined>(async () => {
    if (!request || !provider) return undefined

    try {
      await provider.call({ from: request.from, to: request.guard, data: encodeGuardCheck(request.tx) })
      return { status: 'allowed' }
    } catch (error) {
      // A revert is the answer here, not a failure: the guard reverts to refuse a transaction.
      return decodeGuardCheckFailure(revertDataOf(error))
    }
  }, [request, provider])

  const action = useMemo(() => (request ? classifyGuardAction(request.tx, request.from) : undefined), [request])

  return { result, action, isLoading: !!request && isLoading }
}
