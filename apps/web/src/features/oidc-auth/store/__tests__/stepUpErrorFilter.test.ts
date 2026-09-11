import type { UnknownAction } from '@reduxjs/toolkit'
import { makeStore } from '@/store'
import { selectNotifications, showNotification } from '@/store/notificationsSlice'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'

// RTK's `isRejectedWithValue` matcher checks `requestId` and `requestStatus` as
// well as the payload, so a hand-written action without them makes the listener
// that starts the step-up silently never fire.
const elevationRequiredRejection = {
  type: 'cgwClient/executeMutation/rejected',
  payload: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } },
  error: { message: 'Rejected' },
  meta: {
    requestId: 'test-request-id',
    requestStatus: 'rejected',
    rejectedWithValue: true,
    arg: { type: 'mutation', endpointName: 'spaceSafesCreateV1', originalArgs: {} },
  },
} as UnknownAction

describe('stepUpErrorFilter', () => {
  it('should, when a request was rejected because a fresh second factor is needed, drop the error toast its call site raises', () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    store.dispatch(elevationRequiredRejection)

    store.dispatch(
      showNotification({
        message: 'Failed to add Safe to workspace. Verify your identity to continue with this action.',
        variant: 'error',
        groupKey: 'add-safe-to-workspace-error',
      }),
    )

    expect(selectNotifications(store.getState())).toEqual([])
  })

  it('should, when the user is being sent to verify, keep a success toast', () => {
    const store = makeStore({ stepUp: { phase: 'leaving' } }, { skipBroadcast: true })

    store.dispatch(showNotification({ message: 'Safe account added', variant: 'success', groupKey: 'added' }))

    expect(selectNotifications(store.getState())).toHaveLength(1)
    expect(selectNotifications(store.getState())[0].message).toBe('Safe account added')
  })

  it('should, when the user is back from verifying, keep an error toast so the replay can report its failure', () => {
    const store = makeStore({ stepUp: { phase: 'returning' } }, { skipBroadcast: true })

    store.dispatch(
      showNotification({
        message: 'Verification succeeded, but the action could not be completed. Please try again.',
        variant: 'error',
        groupKey: 'step-up-replay-failed',
      }),
    )

    expect(selectNotifications(store.getState())).toHaveLength(1)
    expect(selectNotifications(store.getState())[0].message).toBe(
      'Verification succeeded, but the action could not be completed. Please try again.',
    )
  })

  it('should, when no step-up is under way, keep an error toast', () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    store.dispatch(showNotification({ message: 'Failed to reject request', variant: 'error', groupKey: 'reject' }))

    expect(selectNotifications(store.getState())).toHaveLength(1)
    expect(selectNotifications(store.getState())[0].message).toBe('Failed to reject request')
  })
})
