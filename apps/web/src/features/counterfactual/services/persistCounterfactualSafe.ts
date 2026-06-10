import type { AppDispatch } from '@/store'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { toBackendDto } from './counterfactualSafeMapper'
import { replayCounterfactualSafeDeployment } from './safeDeployment'
import { enqueuePendingCfDelete } from '../store/pendingCfDeletesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { normalizeSpaceId } from '@/utils/spaces'

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
  dispatch: AppDispatch
}

export type PersistResult = { ok: true } | { ok: false; error: Error }

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
  dispatch,
}: PersistArgs): Promise<PersistResult> => {
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
      } else {
        const spaceResult = await dispatch(
          spacesApi.endpoints.spaceSafesCreateV1.initiate({
            spaceId: resolvedSpaceId,
            createSpaceSafesDto: { safes: [{ chainId, address: safeAddress }] },
          }),
        )
        if ('error' in spaceResult) {
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

  // 2. Add to Redux only after backend has confirmed (or is skipped for
  //    unauth users). Keeps local state in sync with the backend.
  replayCounterfactualSafeDeployment(chainId, safeAddress, props, name, dispatch, payMethod)

  return { ok: true }
}

const CONFLICT_MESSAGE =
  'A counterfactual Safe with these parameters already exists on this chain. Please contact support if this is unexpected.'

type BackendError = { status?: number; data?: { message?: string } }

function toSpaceError(error: unknown): Error {
  return new Error((error as BackendError)?.data?.message || 'Failed to add Safe account to workspace')
}

function toPersistError(error: unknown): Error {
  if ((error as BackendError)?.status === 409) {
    return new Error(CONFLICT_MESSAGE)
  }
  return new Error('Failed to save Safe Account to backend')
}
