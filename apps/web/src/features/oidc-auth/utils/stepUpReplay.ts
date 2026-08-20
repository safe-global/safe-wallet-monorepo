import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SerializedError, ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { AppDispatch, RootState } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

/**
 * The action interrupted by a step-up challenge, held across the redirect to the
 * provider. `sessionStorage` rather than Redux because the browser leaves the
 * app entirely: an in-memory closure cannot survive the round-trip.
 */
const STEP_UP_ACTION_KEY = 'oidc_step_up_action'

/**
 * The mutations CGW guards with its `ElevationGuard`, each with the copy shown
 * once it completes on the way back.
 *
 * An allowlist rather than "replay whatever failed": replay re-fires a request
 * without the user pressing anything, so the set of endpoints that can happen
 * to is pinned here deliberately, and stays reviewable as CGW gates more routes.
 *
 * @see https://github.com/safe-global/safe-client-gateway/pull/3315
 */
const REPLAYABLE_ENDPOINTS = {
  spaceSafesCreateV1: 'Safe account added',
  spaceSafesDeleteV1: 'Safe account removed',
  spacesUpdateV1: 'Workspace updated',
  spacesDeleteV1: 'Workspace deleted',
  membersInviteUserV1: 'Invitation sent',
  membersUpdateRoleV1: 'Role updated',
  membersRemoveUserV1: 'Member removed',
  addressBooksUpsertAddressBookItemsV1: 'Address book updated',
  addressBooksDeleteByAddressV1: 'Address removed from the address book',
  addressBookRequestsApproveRequestV1: 'Address book request approved',
} as const

type ReplayableEndpoint = keyof typeof REPLAYABLE_ENDPOINTS

export type PendingStepUpAction = {
  endpoint: ReplayableEndpoint
  args: unknown
}

const REPLAY_FAILED_MESSAGE = 'Verification succeeded, but the action could not be completed. Please try again.'

const isReplayableEndpoint = (value: unknown): value is ReplayableEndpoint =>
  typeof value === 'string' && value in REPLAYABLE_ENDPOINTS

/**
 * Reads the failed request off a rejected RTK Query action.
 *
 * RTK Query puts the endpoint name and the original arguments on the thunk's
 * `meta.arg`, so the request can be reconstructed centrally from the rejection
 * itself — no call site has to hand its payload over before redirecting.
 *
 * Returns `undefined` for anything not on the allowlist, which also filters out
 * queries and non-CGW rejections.
 */
export const getReplayableAction = (action: unknown): PendingStepUpAction | undefined => {
  if (typeof action !== 'object' || action === null || !('meta' in action)) return undefined

  const { meta } = action
  if (typeof meta !== 'object' || meta === null || !('arg' in meta)) return undefined

  const { arg } = meta
  if (typeof arg !== 'object' || arg === null || !('endpointName' in arg)) return undefined
  if (!isReplayableEndpoint(arg.endpointName)) return undefined

  return {
    endpoint: arg.endpointName,
    args: 'originalArgs' in arg ? arg.originalArgs : undefined,
  }
}

export const savePendingStepUpAction = (action: PendingStepUpAction): void => {
  sessionStorage.setItem(STEP_UP_ACTION_KEY, JSON.stringify(action))
}

export const clearPendingStepUpAction = (): void => {
  sessionStorage.removeItem(STEP_UP_ACTION_KEY)
}

/**
 * Returns the stored action and removes it in the same breath.
 *
 * Removing before the replay is attempted — not after — is what stops a request
 * that keeps failing from being retried on every subsequent page load.
 */
export const takePendingStepUpAction = (): PendingStepUpAction | undefined => {
  const raw = sessionStorage.getItem(STEP_UP_ACTION_KEY)
  if (!raw) return undefined

  clearPendingStepUpAction()

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || !('endpoint' in parsed)) return undefined
    if (!isReplayableEndpoint(parsed.endpoint)) return undefined

    return { endpoint: parsed.endpoint, args: 'args' in parsed ? parsed.args : undefined }
  } catch {
    return undefined
  }
}

type ReplayOutcome = { error?: FetchBaseQueryError | SerializedError }

/**
 * Indexing `cgwApi.endpoints` with a union of endpoint names produces a union of
 * `initiate` thunks — one per argument type — which `dispatch` cannot accept, and
 * `args` has lost its compile-time type to JSON by the time it is read back.
 *
 * Both are collapsed to one signature here. The endpoint and its arguments are
 * only ever stored together, taken from the single request that failed, so
 * re-pairing them is sound.
 */
type ReplayInitiator = (args: unknown) => ThunkAction<Promise<ReplayOutcome>, RootState, unknown, UnknownAction>

const asReplayInitiator = (endpoint: ReplayableEndpoint): ReplayInitiator =>
  cgwApi.endpoints[endpoint].initiate as unknown as ReplayInitiator

/**
 * Completes the action the step-up challenge interrupted.
 *
 * Dispatching the endpoint's own `initiate` thunk rather than calling a
 * component hook keeps this runnable from the callback, and still runs the
 * endpoint's `invalidatesTags` so the lists on screen refresh.
 */
export const replayPendingStepUpAction = async (dispatch: AppDispatch): Promise<void> => {
  const pending = takePendingStepUpAction()
  if (!pending) return

  const result = await dispatch(asReplayInitiator(pending.endpoint)(pending.args))

  if (result.error) {
    dispatch(
      showNotification({
        message: getRtkQueryErrorMessage(result.error) || REPLAY_FAILED_MESSAGE,
        variant: 'error',
        groupKey: 'step-up-replay-failed',
      }),
    )
    return
  }

  // The mutation's `invalidatesTags` has started refetches by now; the success
  // toast must not appear while lists still show pre-mutation data. Dispatching
  // the thunk returns one promise per running query, not a single promise.
  await Promise.all(dispatch(cgwApi.util.getRunningQueriesThunk()))

  dispatch(
    showNotification({
      message: REPLAYABLE_ENDPOINTS[pending.endpoint],
      variant: 'success',
      groupKey: 'step-up-replay-success',
    }),
  )
}
