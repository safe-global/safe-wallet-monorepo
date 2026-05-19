import type { AppDispatch } from '@/store'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { toBackendDto } from './counterfactualSafeMapper'
import { replayCounterfactualSafeDeployment } from './safeDeployment'

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

    if (spaceId) {
      const spaceResult = await dispatch(
        spacesApi.endpoints.spaceSafesCreateV1.initiate({
          spaceId: Number(spaceId),
          createSpaceSafesDto: { safes: [{ chainId, address: safeAddress }] },
        }),
      )
      if ('error' in spaceResult) {
        // Roll back the user-level entry so the backend doesn't end up with
        // a safe that the user "created" but failed to associate with their
        // active space. Failure here is non-fatal: the next sign-in's sync
        // will surface the orphan locally and the user can retry.
        await dispatch(
          counterfactualSafesApi.endpoints.counterfactualSafesDeleteV1.initiate({
            deleteCounterfactualSafesDto: { safes: [{ chainId, address: safeAddress }] },
          }),
        )
        return { ok: false, error: new Error('Failed to add Safe Account to space') }
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

function toPersistError(error: unknown): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 409
  ) {
    return new Error(CONFLICT_MESSAGE)
  }
  return new Error('Failed to save Safe Account to backend')
}
