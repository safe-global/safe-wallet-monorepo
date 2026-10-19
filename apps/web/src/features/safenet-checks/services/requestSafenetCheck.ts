import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'
import { delay } from '@safe-global/utils/utils/helpers'
import { cgwApi as safenetApi } from '@safe-global/store/gateway/AUTO_GENERATED/safenet'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { Errors, logError } from '@/services/exceptions'
import { getLocationSpaceId, isLegacySpaceId, parseSpaceId } from '@/hooks/useUrlSpaceId'
import { getStoreInstance, type RootState } from '@/store'
import { MixpanelEventParams, SAFENET_EVENTS, trackEvent } from '@/services/analytics'
import { isAuthenticated } from '@/store/authSlice'

// The request is idempotent: CGW answers 202 for a check that is already queued
const RETRY_DELAYS_MS: ReadonlyArray<number> = [2_000, 5_000, 15_000]

// Refusals, not faults: 402 plan lacks the entitlement, 403 Workspace refused, 501 chain off
const REFUSAL_STATUSES: ReadonlyArray<number> = [402, 403, 501]

// RTK Query reports a request that never got a response as FETCH_ERROR
const isNetworkError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 'FETCH_ERROR'

// CGW answers its daily limit with a JSON body; the ingress rate limiter answers with an HTML page
const hasJsonBody = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'data' in error &&
  typeof error.data === 'object' &&
  error.data !== null

type Failure = 'refusal' | 'transient' | 'fault'

const classifyFailure = (error: unknown): Failure => {
  const status = getHttpStatusFromError(error)
  if (status === undefined) return isNetworkError(error) ? 'transient' : 'fault'
  if (status === 429) return hasJsonBody(error) ? 'refusal' : 'transient'
  if (REFUSAL_STATUSES.includes(status)) return 'refusal'
  return status === 408 || status >= 500 ? 'transient' : 'fault'
}

/** Retries transient failures; throws the last error when it is final or the retries run out. */
const sendWithRetry = async (send: () => Promise<unknown>): Promise<void> => {
  for (let attempt = 0; ; attempt++) {
    try {
      await send()
      return
    } catch (error) {
      if (classifyFailure(error) !== 'transient' || attempt >= RETRY_DELAYS_MS.length) throw error
      await delay(RETRY_DELAYS_MS[attempt])
    }
  }
}

// Reads the loaded chain config only; it never starts a fetch
const isEnabledOnChain = (state: RootState, chainId: string): boolean => {
  const { data } = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state)
  const chain = data ? chainsAdapter.getSelectors().selectById(data, chainId) : undefined
  return chain !== undefined && hasFeature(chain, FEATURES.SAFENET_CHECKS)
}

/**
 * Asks CGW to start a check paid by the Workspace in the page URL.
 * Never rejects: signing must not depend on it. Retries transient failures in the
 * background, so callers must not await it.
 */
export const requestSafenetCheck = async ({
  chainId,
  safeAddress,
  safeTxHash,
  isFirstSignature,
}: {
  chainId: string
  safeAddress: string
  safeTxHash: string
  isFirstSignature: boolean
}): Promise<void> => {
  try {
    const store = getStoreInstance()
    const state = store.getState()
    const spaceId = parseSpaceId(getLocationSpaceId())
    // CGW accepts only a Workspace UUID in the route
    if (!spaceId || isLegacySpaceId(spaceId)) return
    if (!isAuthenticated(state) || !isEnabledOnChain(state, chainId)) return

    const { initiate } = safenetApi.endpoints.safenetChecksRequestCheckV1
    const check = { spaceId, chainId, safeAddress, createSafenetCheckDto: { safeTxHash } }
    await sendWithRetry(() => store.dispatch(initiate(check)).unwrap())
    if (isFirstSignature) trackEvent(SAFENET_EVENTS.SUBMITTED, { [MixpanelEventParams.SAFE_TX_HASH]: safeTxHash })
  } catch (error) {
    if (classifyFailure(error) !== 'refusal') logError(Errors._652, error)
  }
}
