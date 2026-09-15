import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { FetchArgs } from '@reduxjs/toolkit/query'
import type { AppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
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

/**
 * The request as the endpoint prepared it, rather than the arguments it was
 * called with: RTK Query keeps no record of a mutation's arguments while it is
 * in flight, and the prepared request is enough to send it again.
 */
export type PendingStepUpAction = {
  endpoint: ReplayableEndpoint
  request: FetchArgs
}

const REPLAY_FAILED_MESSAGE = 'Verification succeeded, but the action could not be completed. Please try again.'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isReplayableEndpoint = (value: string): value is ReplayableEndpoint => value in REPLAYABLE_ENDPOINTS

const isFetchArgs = (value: unknown): value is FetchArgs => isRecord(value) && typeof value.url === 'string'

export const toReplayableRequest = (endpoint: string, request: FetchArgs): PendingStepUpAction | undefined =>
  isReplayableEndpoint(endpoint) ? { endpoint, request } : undefined

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

/** Unconsumed trip: the user left for the challenge and this page never reloaded on the way back. */
export const hasPendingStepUpTrip = (): boolean => {
  try {
    return sessionStorage.getItem(STEP_UP_KEY) !== null
  } catch {
    return false
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
    if (!isFetchArgs(parsed.request)) return {}

    return { action: { endpoint: parsed.endpoint, request: parsed.request } }
  } catch {
    return undefined
  }
}

/** Every endpoint in `REPLAYABLE_ENDPOINTS` invalidates this tag and no other. */
const REPLAY_INVALIDATED_TAGS = ['spaces'] as const

// One endpoint sends any stored request again, invalidating what the gated
// endpoints invalidate, since the request no longer carries its endpoint's tags.
const replayApi = cgwApi.injectEndpoints({
  endpoints: (build) => ({
    replayStepUpRequest: build.mutation<unknown, FetchArgs>({
      query: (request) => request,
      invalidatesTags: [...REPLAY_INVALIDATED_TAGS],
    }),
  }),
})

export const replayStepUpAction = async (dispatch: AppDispatch, pending: PendingStepUpAction): Promise<void> => {
  const result = await dispatch(replayApi.endpoints.replayStepUpRequest.initiate(pending.request))

  if (result.error) {
    // Rejected again means the user walked away from the challenge, which is a
    // cancellation and not something to report back to them.
    if (isElevationRequiredError(result.error)) return

    dispatch(
      showNotification({
        message: getRtkQueryErrorMessage(result.error) || REPLAY_FAILED_MESSAGE,
        variant: 'error',
        groupKey: 'step-up-replay-failed',
      }),
    )
    return
  }

  // The success message must not appear while the lists still show the old data.
  // This thunk returns one promise per running query, not a single promise.
  await Promise.all(dispatch(cgwApi.util.getRunningQueriesThunk()))

  // The replay runs during page load, so a query it invalidates can still be in
  // flight when the mutation completes. RTK Query does not start a second fetch
  // for such a query, and its `delayed` invalidation does not wait for it either:
  // the pending counter behind it is also decremented by the rejection that a
  // duplicate `initiate` of the same in-flight query produces, so the counter is
  // zero while the first request is still open. The query then keeps the response
  // it gets, which may have been produced before the write. Invalidating again
  // once nothing is in flight fetches every affected query with the written data.
  dispatch(cgwApi.util.invalidateTags([...REPLAY_INVALIDATED_TAGS]))
  await Promise.all(dispatch(cgwApi.util.getRunningQueriesThunk()))

  dispatch(
    showNotification({
      message: REPLAYABLE_ENDPOINTS[pending.endpoint],
      variant: 'success',
      groupKey: 'step-up-replay-success',
    }),
  )
}
