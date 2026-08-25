import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SerializedError, ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { AppDispatch, RootState } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { STEP_UP_FAILED_MESSAGE } from '../constants'
import { isElevationRequiredError } from './elevation'

/**
 * The single record of a step-up round-trip in flight: when it started, and the
 * action to complete once it returns. `sessionStorage` rather than Redux because
 * the browser leaves the app entirely.
 *
 * One key, not a separate in-flight marker plus payload: those are written and
 * cleared by different code at different moments, and both ways they can
 * disagree were reproducible — a marker left behind suppressed every later
 * redirect in the tab, and a payload left behind waited to be executed by an
 * unrelated trip's return.
 */
const STEP_UP_KEY = 'oidc_step_up'

/**
 * A trip cannot validly outlive CGW's one-time state cookie (5 minutes), so an
 * older record is residue of an abandoned trip: deleted on sight, never acted
 * on. Whatever state a tab is left in, it heals itself within this window.
 */
const STEP_UP_MAX_AGE_MS = 5 * 60 * 1_000

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

export type StepUpTrip = {
  /** Absent when the gated endpoint is not on the replay allowlist. */
  action?: PendingStepUpAction
}

/** Wrapped so a storage failure can never block the redirect itself. */
export const saveStepUpTrip = (action?: PendingStepUpAction): void => {
  try {
    sessionStorage.setItem(STEP_UP_KEY, JSON.stringify({ ...action, createdAt: Date.now() }))
  } catch {
    // Degrades to a trip with no return handling: the session still elevates.
  }
}

/**
 * Returns the trip in flight and removes it in the same breath, so a record can
 * never be acted on twice, later, or by a different trip's return. Removing
 * before anything is attempted also stops a request that keeps failing from
 * being retried on every subsequent page load. Expired or malformed records are
 * deleted unexamined.
 */
export const takeStepUpTrip = (): StepUpTrip | undefined => {
  const raw = sessionStorage.getItem(STEP_UP_KEY)
  if (!raw) return undefined

  sessionStorage.removeItem(STEP_UP_KEY)

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return undefined
    if (!('createdAt' in parsed) || typeof parsed.createdAt !== 'number') return undefined
    if (Date.now() - parsed.createdAt > STEP_UP_MAX_AGE_MS) return undefined
    if (!('endpoint' in parsed) || !isReplayableEndpoint(parsed.endpoint)) return {}

    return { action: { endpoint: parsed.endpoint, args: 'args' in parsed ? parsed.args : undefined } }
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
export const replayStepUpAction = async (dispatch: AppDispatch, pending: PendingStepUpAction): Promise<void> => {
  const result = await dispatch(asReplayInitiator(pending.endpoint)(pending.args))

  if (result.error) {
    // Still gated means the challenge was never completed — the user backed out
    // of the provider's page and came back. Say that, rather than the inline
    // "verify your identity" copy, which reads as an instruction with nothing to
    // act on for an action they walked away from.
    const message = isElevationRequiredError(result.error)
      ? STEP_UP_FAILED_MESSAGE
      : getRtkQueryErrorMessage(result.error) || REPLAY_FAILED_MESSAGE

    dispatch(
      showNotification({
        message,
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
