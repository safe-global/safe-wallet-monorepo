import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SerializedError, ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { AppDispatch, RootState } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { STEP_UP_FAILED_MESSAGE } from '../constants'
import { isElevationRequiredError } from './elevation'

const STEP_UP_KEY = 'oidc_step_up'

const STEP_UP_MAX_AGE_MS = 5 * 60 * 1_000

/**
 * A replay sends a request again without the user clicking anything, so the
 * endpoints it can do that to are listed here rather than taken from whichever
 * request was rejected.
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

/** Checked field by field: the listener passes an `UnknownAction`, and RTK types `meta.arg` as `unknown`. */
export const getReplayableAction = (action: UnknownAction): PendingStepUpAction | undefined => {
  const arg = isRecord(action.meta) ? action.meta.arg : undefined
  if (!isRecord(arg) || typeof arg.endpointName !== 'string') return undefined
  if (!isReplayableEndpoint(arg.endpointName)) return undefined

  return { endpoint: arg.endpointName, args: arg.originalArgs }
}

export type StepUpTrip = {
  /** Missing when the endpoint that was rejected is not in the list above. */
  action?: PendingStepUpAction
}

export const saveStepUpTrip = (action?: PendingStepUpAction): void => {
  try {
    sessionStorage.setItem(STEP_UP_KEY, JSON.stringify({ ...action, createdAt: Date.now() }))
  } catch {
    // A storage failure must not block the redirect; the session still elevates.
  }
}

/** Reads and removes in one step, so a saved request cannot run twice, or on a later return. */
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
 * `cgwApi.endpoints[name].initiate` is a different signature per endpoint, so a
 * union of names gives a union of thunks that `dispatch` rejects, and `args` lost
 * its type when it went through JSON. Collapsing both to one signature is safe
 * because an endpoint and its arguments are only ever stored together, taken from
 * the single request that was rejected.
 */
type ReplayInitiator = (args: unknown) => ThunkAction<Promise<ReplayOutcome>, RootState, unknown, UnknownAction>

const asReplayInitiator = (endpoint: ReplayableEndpoint): ReplayInitiator =>
  cgwApi.endpoints[endpoint].initiate as unknown as ReplayInitiator

export const replayStepUpAction = async (dispatch: AppDispatch, pending: PendingStepUpAction): Promise<void> => {
  const result = await dispatch(asReplayInitiator(pending.endpoint)(pending.args))

  if (result.error) {
    // Rejected again means the user never finished verifying, so the usual
    // "verify your identity" text would ask them to redo what they walked away from.
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

  // The success message must not appear while the lists still show the old data.
  // This thunk returns one promise per running query, not a single promise.
  await Promise.all(dispatch(cgwApi.util.getRunningQueriesThunk()))

  dispatch(
    showNotification({
      message: REPLAYABLE_ENDPOINTS[pending.endpoint],
      variant: 'success',
      groupKey: 'step-up-replay-success',
    }),
  )
}
