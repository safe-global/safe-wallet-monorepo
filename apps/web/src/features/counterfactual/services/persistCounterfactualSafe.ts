import type { AppDispatch } from '@/store'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import { toBackendDto } from './counterfactualSafeMapper'
import { replayCounterfactualSafeDeployment } from './safeDeployment'
import { enqueuePendingCfDelete } from '../store/pendingCfDeletesSlice'
import { addSafeToSpace } from '@/features/spaces/services'

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
  spaceSafeCount,
  isMultiChainCreation,
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

    const spaceResult = await addSafeToSpace({
      chainId,
      safeAddress,
      spaceId,
      isAdminOfActiveSpace,
      spaceSafeCount,
      dispatch,
    })

    if (spaceResult.status === 'failed') {
      // A limit rejection means another admin filled the space in the meantime.
      // The Safe itself was still created, so a single-chain creation keeps it
      // and succeeds (the user has already been warned). In a multi-chain batch
      // the safe genuinely wasn't attached on this chain, so roll back and
      // report failure — otherwise the caller records this chain as created.
      const shouldRollBack = !spaceResult.isLimitRejection || isMultiChainCreation === true

      if (shouldRollBack) {
        // Roll back the user-level entry so the backend doesn't end up with a
        // safe that the user "created" but failed to associate with their
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
        return { ok: false, error: spaceResult.error }
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

function toPersistError(error: unknown): Error {
  if ((error as BackendError)?.status === 409) {
    return new Error(CONFLICT_MESSAGE)
  }
  return new Error('Failed to save Safe account to backend')
}
