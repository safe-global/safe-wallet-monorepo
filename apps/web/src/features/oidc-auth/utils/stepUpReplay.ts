import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SerializedError, ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { AppDispatch, RootState } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { STEP_UP_FAILED_MESSAGE } from '../constants'
import { isElevationRequiredError } from './elevation'

/**
 * One key rather than a separate in-flight marker and payload. Split across two
 * keys they are written and cleared at different moments and can disagree: a
 * leftover marker suppresses every later redirect in the tab, and a leftover
 * payload is executed by an unrelated return.
 */
const STEP_UP_KEY = 'oidc_step_up'

/** A trip cannot validly outlive CGW's one-time state cookie. */
const STEP_UP_MAX_AGE_MS = 5 * 60 * 1_000

/**
 * Replay re-fires a request without the user pressing anything, so the endpoints
 * that can happen to are pinned here rather than derived from whatever failed.
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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isReplayableEndpoint = (value: string): value is ReplayableEndpoint => value in REPLAYABLE_ENDPOINTS

/**
 * Rebuilds the failed request from the rejection itself, so no call site has to
 * hand its payload over before redirecting. Anything off the allowlist returns
 * undefined, which also filters out queries and non-CGW rejections.
 *
 * Narrowed by hand because the listener middleware hands the effect an
 * `UnknownAction` and RTK types `meta.arg` as `unknown`.
 */
export const getReplayableAction = (action: UnknownAction): PendingStepUpAction | undefined => {
  const arg = isRecord(action.meta) ? action.meta.arg : undefined
  if (!isRecord(arg) || typeof arg.endpointName !== 'string') return undefined
  if (!isReplayableEndpoint(arg.endpointName)) return undefined

  return { endpoint: arg.endpointName, args: arg.originalArgs }
}

export type StepUpTrip = {
  /** Absent when the gated endpoint is not on the replay allowlist. */
  action?: PendingStepUpAction
}

export const saveStepUpTrip = (action?: PendingStepUpAction): void => {
  try {
    sessionStorage.setItem(STEP_UP_KEY, JSON.stringify({ ...action, createdAt: Date.now() }))
  } catch {
    // A storage failure must not block the redirect; the session still elevates.
  }
}

/**
 * Reads and removes in one step, so a record can never be acted on twice, later,
 * or by a different trip's return — and a request that keeps failing is not
 * retried on every subsequent page load.
 */
export const takeStepUpTrip = (): StepUpTrip | undefined => {
  const raw = sessionStorage.getItem(STEP_UP_KEY)
  if (!raw) return undefined

  sessionStorage.removeItem(STEP_UP_KEY)

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.createdAt !== 'number') return undefined
    if (Date.now() - parsed.createdAt > STEP_UP_MAX_AGE_MS) return undefined
    if (typeof parsed.endpoint !== 'string' || !isReplayableEndpoint(parsed.endpoint)) return {}

    return { action: { endpoint: parsed.endpoint, args: parsed.args } }
  } catch {
    return undefined
  }
}

type ReplayOutcome = { error?: FetchBaseQueryError | SerializedError }

/**
 * Indexing `cgwApi.endpoints` with a union of endpoint names produces a union of
 * `initiate` thunks that `dispatch` cannot accept, and `args` has lost its type
 * to JSON. Collapsed to one signature: endpoint and args are only ever stored
 * together, from the single request that failed.
 */
type ReplayInitiator = (args: unknown) => ThunkAction<Promise<ReplayOutcome>, RootState, unknown, UnknownAction>

const asReplayInitiator = (endpoint: ReplayableEndpoint): ReplayInitiator =>
  cgwApi.endpoints[endpoint].initiate as unknown as ReplayInitiator

/**
 * Dispatches the endpoint's own `initiate` thunk rather than calling a component
 * hook, so this is runnable from the callback and still fires the endpoint's
 * `invalidatesTags`.
 */
export const replayStepUpAction = async (dispatch: AppDispatch, pending: PendingStepUpAction): Promise<void> => {
  const result = await dispatch(asReplayInitiator(pending.endpoint)(pending.args))

  if (result.error) {
    // Still gated means the challenge was never completed, so the inline "verify
    // your identity" copy would instruct the user to do what they just abandoned.
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

  // Awaited so the success toast lands after the refetches, not next to stale
  // lists. The thunk returns one promise per running query, hence `all`.
  await Promise.all(dispatch(cgwApi.util.getRunningQueriesThunk()))

  dispatch(
    showNotification({
      message: REPLAYABLE_ENDPOINTS[pending.endpoint],
      variant: 'success',
      groupKey: 'step-up-replay-success',
    }),
  )
}
