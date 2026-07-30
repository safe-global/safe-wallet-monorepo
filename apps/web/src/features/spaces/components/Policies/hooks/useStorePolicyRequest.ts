import { useCallback } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { usePoliciesCreateRequestV1Mutation } from '@safe-global/store/gateway/policies'
import type { PolicyConfigurationInput } from '@safe-global/store/gateway/policies/types'
import { useCurrentSpaceId } from '@/features/spaces'
import { logError, Errors } from '@/services/exceptions'
import type { PolicyConfiguration } from '../shared/guardTx'

export type StorePolicyRequestInput = {
  chainId: string
  safeAddress: string
  /** The same root that goes on-chain in `requestConfiguration` — computed once, used twice. */
  root: string
  configurations: PolicyConfiguration[]
}

/**
 * Why `failed` rather than a thrown error: CGW hit its per-Safe stored-request cap
 * (or refused the row for another reason). The on-chain request is unaffected, so the
 * caller carries on — only the pending row stays unexplained.
 */
export type StorePolicyRequestResult = { ok: true } | { ok: false; isCapReached: boolean }

/** The write endpoint takes the numeric on-chain operation, unlike the read routes. */
const toInput = (configuration: PolicyConfiguration): PolicyConfigurationInput => ({
  target: configuration.target,
  selector: configuration.selector,
  operation: configuration.operation === 1 ? 1 : 0,
  policy: configuration.policy,
  data: configuration.data,
})

const statusOf = (error: unknown): number | undefined => {
  const status = (error as FetchBaseQueryError | undefined)?.status
  return typeof status === 'number' ? status : undefined
}

/** Network errors and 5xx are worth one more attempt; a 4xx won't change on retry. */
const isRetryable = (error: unknown): boolean => {
  const status = statusOf(error)
  return status === undefined || status >= 500
}

/**
 * Hands the `Configuration[]` behind a delayed policy request to CGW.
 *
 * `requestConfiguration(root)` publishes only the root, so until the wallet stores the
 * payload nobody can say what a pending request changes. Call this immediately before
 * proposing the transaction: any earlier and an abandoned builder session leaves an
 * inert row that still counts against the Safe's stored-request cap.
 *
 * Never throws and never blocks — the store is an annotation, not part of the policy
 * taking effect. Retries once on a network error or 5xx, then reports the failure.
 */
export const useStorePolicyRequest = (): ((input: StorePolicyRequestInput) => Promise<StorePolicyRequestResult>) => {
  const spaceId = useCurrentSpaceId()
  const [createRequest] = usePoliciesCreateRequestV1Mutation()

  return useCallback(
    async ({ chainId, safeAddress, root, configurations }) => {
      if (!spaceId) return { ok: false, isCapReached: false }

      const arg = { spaceId, chainId, safeAddress, root, configurations: configurations.map(toInput) }

      // One retry: the POST is idempotent per (chainId, safeAddress, root).
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await createRequest(arg).unwrap()
          return { ok: true }
        } catch (error) {
          if (attempt === 0 && isRetryable(error)) continue

          logError(Errors._822, error)
          return { ok: false, isCapReached: statusOf(error) === 400 }
        }
      }

      return { ok: false, isCapReached: false }
    },
    [spaceId, createRequest],
  )
}
