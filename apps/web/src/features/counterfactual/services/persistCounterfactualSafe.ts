import type { JsonRpcProvider } from 'ethers'
import type { AppDispatch } from '@/store'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { isSmartContract } from '@/utils/wallets'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { toBackendDto } from './counterfactualSafeMapper'
import { replayCounterfactualSafeDeployment } from './safeDeployment'
import { enqueuePendingCfDelete } from '../store/pendingCfDeletesSlice'
import { removeUndeployedSafe } from '../store/undeployedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { normalizeSpaceId } from '@/utils/spaces'
import { SAFE_ACCOUNTS_LIMIT } from '@/features/spaces/constants'

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
  /** Number of safes already in the active space. When at `SAFE_ACCOUNTS_LIMIT`
   *  the backend would reject the add; the safe is still persisted at the user
   *  level and the user is informed via a toast. */
  spaceSafeCount?: number
  /** True when this call is one chain of a multi-chain creation batch. A space
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

export type PersistResult = { ok: true; skipped?: 'already-deployed' } | { ok: false; error: Error }

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
  isMultiChainCreation,
  provider,
  dispatch,
}: PersistArgs): Promise<PersistResult> => {
  // 0. Never store an already-deployed Safe as counterfactual — it would show as
  //    "Not activated". Skip without a chain-specific provider; fail open on error.
  if (provider) {
    let isDeployed = false
    try {
      isDeployed = await isSmartContract(safeAddress, provider)
    } catch {
      // Couldn't verify deployment — fail open and let the persist proceed.
    }

    if (isDeployed) {
      // Drop any stale undeployed entry; the caller re-adds it as a regular Safe.
      dispatch(removeUndeployedSafe({ chainId, address: safeAddress }))
      return { ok: true, skipped: 'already-deployed' }
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
            message: 'Safe added to your accounts — ask an admin to add it to the workspace',
          }),
        )
      } else if (spaceSafeCount !== undefined && spaceSafeCount >= SAFE_ACCOUNTS_LIMIT) {
        // Space is full — the backend would reject the add. Skip it and keep the
        // user-level safe so creation still succeeds, but tell the user it
        // wasn't added to the workspace.
        dispatch(
          showNotification({
            variant: 'info',
            groupKey: 'cf-safe-space-limit',
            message: `Safe created. This workspace is full (${SAFE_ACCOUNTS_LIMIT} Safes), so it wasn't added — switch to another workspace to add it there`,
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
          // Use case: another admin added Safes to the same workspace in the meantime.
          // The cached count was stale and the backend returned 400.
          // The Safe itself was still created, so keep it and show the warning.
          if (isLimitRejection(spaceResult.error)) {
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

// Shown on backend 409 (conflict) — the Safe likely already exists or is deployed.
const CONFLICT_MESSAGE =
  "This Safe can't be created as a counterfactual account — it may already exist or be deployed. Try adding it as a regular Safe account instead."

type BackendError = { status?: number; data?: { message?: string } }

function toSpaceError(error: unknown): Error {
  return new Error((error as BackendError)?.data?.message || 'Failed to add Safe account to workspace')
}

/** Matches the CGW limit message, e.g. "This space only allows a maximum of 40 safe accounts...".
 *  Other 400s (validation, malformed payload) must keep the rollback path. */
function isLimitRejection(error: unknown): boolean {
  const { status, data } = (error as BackendError) ?? {}
  return status === 400 && typeof data?.message === 'string' && /maximum of \d+/i.test(data.message)
}

function toPersistError(error: unknown): Error {
  if ((error as BackendError)?.status === 409) {
    return new Error(CONFLICT_MESSAGE)
  }
  return new Error('Failed to save Safe account to backend')
}
