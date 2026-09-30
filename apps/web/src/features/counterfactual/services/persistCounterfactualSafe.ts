import type { JsonRpcProvider } from 'ethers'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { AppDispatch } from '@/store'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { isSmartContract } from '@/utils/wallets'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { toBackendDto } from './counterfactualSafeMapper'
import { replayCounterfactualSafeDeployment } from './safeDeployment'
import { enqueuePendingCfDelete } from '../store/pendingCfDeletesSlice'
import { removeUndeployedSafe } from '../store/undeployedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { isSpaceAtSafeLimit, normalizeSpaceId, type SafeLimit } from '@/utils/spaces'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'

type PersistArgs = {
  chainId: string
  safeAddress: string
  props: ReplayedSafeProps
  name: string
  payMethod: PayMethod
  /** Active space id (string from auth state), or null if user has none. */
  spaceId: string | null
  /** Whether the user is signed into the CGW session. Non-authed users can
   *  still create counterfactual safes but nothing is written to the backend. */
  isUserAuthenticated: boolean
  /** Whether the user is an active admin of the active space. When false the
   *  safe is not auto-attached to the space (the backend would reject the call
   *  with 403). The safe is still persisted at the user level. */
  isAdminOfActiveSpace: boolean
  /** At `spaceSafeLimit` the add is skipped; the Safe stays at the user level and a toast tells the user. */
  spaceSafeCount?: number
  /** Seats the space's plan allows (`useSpaceSafeLimit`); `null` = unlimited, `undefined` = unknown, so the backend decides. */
  spaceSafeLimit: SafeLimit
  /** The Safe address is already in the space on another chain, so this add takes no new seat. */
  holdsSeatInSpace?: boolean
  /** True when this call is one chain of a multi-chain creation batch. A legacy
   *  limit rejection (400) then means the safe genuinely wasn't attached on this
   *  chain, so we surface it as a failure (after rolling back the user-level
   *  entry) instead of swallowing it as success. Single-create flows keep the
   *  soft toast-and-succeed behavior. */
  isMultiChainCreation?: boolean
  /** Read-only provider for `chainId`, used to check the Safe isn't already
   *  deployed. Must target `chainId`; when absent the check is skipped. */
  provider?: JsonRpcProvider
  dispatch: AppDispatch
}

export type PersistResult =
  | { ok: true; skipped?: 'already-deployed' }
  /** `stepUpPending`: the step-up is taking over, so the caller shows nothing. */
  | { ok: false; error: Error; stepUpPending?: true }

/**
 * Single code path for creating a counterfactual safe: persist to backend
 * (user + optional space), then update local Redux. Used by both the initial
 * safe-creation review step and the add-another-network flow so that any
 * future backend endpoint added to the create path is automatically covered
 * for the add-network path (and vice versa).
 *
 * Returns ok=true only when every required call succeeded. On ok=false the
 * caller must NOT proceed with navigation/analytics/etc — the safe has not
 * been persisted anywhere.
 */
export const persistCounterfactualSafe = async ({
  chainId,
  safeAddress,
  props,
  name,
  payMethod,
  spaceId,
  isUserAuthenticated,
  isAdminOfActiveSpace,
  spaceSafeCount,
  spaceSafeLimit,
  holdsSeatInSpace,
  isMultiChainCreation,
  provider,
  dispatch,
}: PersistArgs): Promise<PersistResult> => {
  // Client-side deploy check, unauth path only — authed users get a 409 from the
  // backend instead (handled below). Skip without a provider; fail open on error.
  if (provider && !isUserAuthenticated) {
    let isDeployed = false
    try {
      isDeployed = await isSmartContract(safeAddress, provider)
    } catch {
      // Couldn't verify deployment — fail open and let the persist proceed.
    }

    if (isDeployed) {
      return recoverAlreadyDeployed({ chainId, safeAddress, props, name, dispatch })
    }
  }

  // 1. Save to backend (blocking). Unauth users fall back to local-only —
  //    matches pre-backend-sync behavior and avoids creating orphan entries
  //    that can never be cleaned up server-side.
  if (isUserAuthenticated) {
    const dto = toBackendDto(chainId, safeAddress, props)
    const userResult = await dispatch(
      counterfactualSafesApi.endpoints.counterfactualSafesCreateV1.initiate({
        createCounterfactualSafesDto: { safes: [dto] },
      }),
    )
    if ('error' in userResult) {
      // CGW rejects an already-deployed Safe with 409. Treat it like the client
      // guard: add the Safe to My accounts as deployed and skip CF creation,
      // rather than surfacing it as a hard failure.
      if (isConflict(userResult.error)) {
        return recoverAlreadyDeployed({ chainId, safeAddress, props, name, dispatch })
      }
      return { ok: false, error: toPersistError(userResult.error) }
    }

    // Guard against persisted/legacy lastUsedSpace values that are empty or
    // whitespace-only — pass any non-empty string through unchanged.
    const resolvedSpaceId = normalizeSpaceId(spaceId)
    if (resolvedSpaceId !== null) {
      if (!isAdminOfActiveSpace) {
        // Backend gates this endpoint on admin role and would 403. Inform the
        // user — the safe is still persisted at the user level above.
        dispatch(
          showNotification({
            variant: 'info',
            groupKey: 'cf-safe-space-skipped',
            message: 'Safe added to your accounts — ask an admin to add it to the Workspace',
          }),
        )
      } else if (!holdsSeatInSpace && isSpaceAtSafeLimit(spaceSafeCount, spaceSafeLimit)) {
        // The plan has no seat left, so the Safe stays in My accounts (the chooser said so upfront).
        dispatch(
          showNotification({
            variant: 'info',
            groupKey: 'cf-safe-space-limit',
            message: seatLimitMessage(spaceSafeLimit),
          }),
        )
      } else {
        const spaceResult = await dispatch(
          spacesApi.endpoints.spaceSafesCreateV1.initiate({
            spaceId: resolvedSpaceId,
            createSpaceSafesDto: { safes: [{ chainId, address: safeAddress }] },
          }),
        )
        if ('error' in spaceResult) {
          // The user-level entry stays, so the replay after verification attaches a Safe that exists.
          if (isElevationRequiredError(spaceResult.error)) {
            return { ok: false, error: toSpaceError(spaceResult.error), stepUpPending: true }
          }
          // Stale cached count (another admin filled the seats); seats are per address, so a 402 never splits a batch.
          const quotaExceeded = getQuotaExceeded(spaceResult.error)
          if (quotaExceeded) {
            dispatch(
              showNotification({
                variant: 'info',
                groupKey: 'cf-safe-space-limit',
                message: seatLimitMessage(quotaExceeded.quota ?? spaceSafeLimit),
              }),
            )
          } else if (isLimitRejection(spaceResult.error)) {
            // Legacy 400 from a space without a plan: the static cap counts rows, not seats.
            dispatch(
              showNotification({
                variant: 'info',
                groupKey: 'cf-safe-space-limit',
                message: toSpaceError(spaceResult.error).message,
              }),
            )
            // In a multi-chain batch the safe genuinely wasn't attached on this
            // chain. Roll back the user-level entry and report failure so the
            // caller doesn't record this chain as successfully created.
            if (isMultiChainCreation) {
              const rollbackResult = await dispatch(
                counterfactualSafesApi.endpoints.counterfactualSafesDeleteV1.initiate({
                  deleteCounterfactualSafesDto: { safes: [{ chainId, address: safeAddress }] },
                }),
              )
              if ('error' in rollbackResult) {
                dispatch(enqueuePendingCfDelete({ chainId, address: safeAddress }))
              }
              return { ok: false, error: toSpaceError(spaceResult.error) }
            }
          } else {
            // Roll back the user-level entry so the backend doesn't end up with
            // a safe that the user "created" but failed to associate with their
            // active space.
            const rollbackResult = await dispatch(
              counterfactualSafesApi.endpoints.counterfactualSafesDeleteV1.initiate({
                deleteCounterfactualSafesDto: { safes: [{ chainId, address: safeAddress }] },
              }),
            )
            if ('error' in rollbackResult) {
              // Rollback also failed — orphan now exists server-side. Queue the
              // cleanup so the next sign-in's sync flushes it, otherwise the GET
              // would re-surface the orphan locally as "Not activated".
              dispatch(enqueuePendingCfDelete({ chainId, address: safeAddress }))
            }
            return { ok: false, error: toSpaceError(spaceResult.error) }
          }
        }
      }
    }
  }

  // 2. Add to Redux only after backend has confirmed (or is skipped for
  //    unauth users). Keeps local state in sync with the backend.
  replayCounterfactualSafeDeployment(chainId, safeAddress, props, name, dispatch, payMethod)

  return { ok: true }
}

/**
 * The Safe is already deployed, so store it as a regular deployed Safe in My
 * accounts (not counterfactual, which shows "Not activated") and drop any stale
 * undeployed entry.
 */
function recoverAlreadyDeployed({
  chainId,
  safeAddress,
  props,
  name,
  dispatch,
}: {
  chainId: string
  safeAddress: string
  props: ReplayedSafeProps
  name: string
  dispatch: AppDispatch
}): PersistResult {
  dispatch(
    addOrUpdateSafe({
      safe: {
        ...defaultSafeInfo,
        chainId,
        address: { value: safeAddress, name },
        threshold: Number(props.safeAccountConfig.threshold),
        owners: props.safeAccountConfig.owners.map((owner) => ({ value: owner })),
      },
    }),
  )
  dispatch(removeUndeployedSafe({ chainId, address: safeAddress }))
  return { ok: true, skipped: 'already-deployed' }
}

type BackendError = { status?: number; data?: { message?: string; code?: string; quota?: number } }

/** CGW rejects an add over the plan's seat quota with a typed 402; returns its quota, or undefined for any other error. */
function getQuotaExceeded(error: unknown): { quota: number | null } | undefined {
  const { status, data } = (error as BackendError) ?? {}
  if (status !== 402 || data?.code !== 'QUOTA_EXCEEDED') return undefined
  return { quota: typeof data.quota === 'number' ? data.quota : null }
}

function seatLimitMessage(limit: SafeLimit): string {
  const seats = typeof limit === 'number' ? `limit of ${limit} Safe accounts` : 'seat limit'
  return `Safe created in My accounts. The Workspace is at its ${seats}, so it wasn't added there.`
}

function isConflict(error: unknown): boolean {
  return (error as BackendError)?.status === 409
}

function toSpaceError(error: FetchBaseQueryError | SerializedError | undefined): Error {
  const fallback = 'Failed to add Safe account to Workspace'
  return new Error(error ? getRtkQueryErrorMessage(error) || fallback : fallback)
}

/** Matches the CGW limit message, e.g. "This space only allows a maximum of 40 safe accounts...".
 *  Other 400s (validation, malformed payload) must keep the rollback path. */
function isLimitRejection(error: unknown): boolean {
  const { status, data } = (error as BackendError) ?? {}
  return status === 400 && typeof data?.message === 'string' && /maximum of \d+/i.test(data.message)
}

function toPersistError(error: FetchBaseQueryError | SerializedError | undefined): Error {
  // 409 (already deployed) is handled upstream via recoverAlreadyDeployed, so it
  // never reaches here — any error at this point is a genuine persist failure.
  const fallback = 'Failed to save Safe account to backend'
  return new Error(error ? getRtkQueryErrorMessage(error) || fallback : fallback)
}
