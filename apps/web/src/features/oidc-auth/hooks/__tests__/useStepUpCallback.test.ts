import { renderHook, waitFor } from '@testing-library/react'
import { useStepUpCallback } from '../useStepUpCallback'
import { STEP_UP_FAILED_MESSAGE, STEP_UP_PENDING_KEY } from '../../constants'

const mockReplace = jest.fn()
const mockReconcileAuth = jest.fn()

jest.mock('@/store/reconcileAuth', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockReconcileAuth(...args),
}))

const mockDispatch = jest.fn((action) => action)

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: Record<string, string>) => ({ type: 'notifications/showNotification', payload }),
}))

const mockReplayPendingStepUpAction = jest.fn()
const mockClearPendingStepUpAction = jest.fn()

jest.mock('../../utils/stepUpReplay', () => ({
  replayPendingStepUpAction: (...args: unknown[]) => mockReplayPendingStepUpAction(...args),
  clearPendingStepUpAction: () => mockClearPendingStepUpAction(),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/spaces/members',
    replace: mockReplace,
  }),
}))

const CLEAR_ELEVATION = { type: 'elevation/clearElevationRequired', payload: undefined }

describe('useStepUpCallback', () => {
  const originalLocation = window.location

  const setSearch = (search: string) => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, search, pathname: '/spaces/members' },
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    mockReconcileAuth.mockResolvedValue('authenticated')
    mockReplayPendingStepUpAction.mockResolvedValue(undefined)
    setSearch('')
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should do nothing when no step-up is pending', async () => {
    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).not.toHaveBeenCalled()
    })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should reconcile the session and clear the prompt on a successful return', async () => {
    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledTimes(1)
    })
    expect(mockDispatch).toHaveBeenCalledWith(CLEAR_ELEVATION)
  })

  it('should consume the pending marker so a reload does not re-process it', async () => {
    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem(STEP_UP_PENDING_KEY)).toBeNull()
    })
  })

  it('should notify and clean the URL when the provider returned an error', async () => {
    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')
    setSearch('?spaceId=42&error=access_denied&error_description=mfa_required')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/showNotification',
        payload: { message: STEP_UP_FAILED_MESSAGE, variant: 'error', groupKey: 'step-up-failed' },
      })
    })

    expect(mockReconcileAuth).not.toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/spaces/members', query: { spaceId: '42' } }, undefined, {
      shallow: true,
    })
  })

  // The dialog must not outlive a failed attempt, or the user is left staring at
  // a prompt for a request that is no longer in flight.
  it('should clear the prompt even when the step-up failed', async () => {
    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')
    setSearch('?error=access_denied')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(CLEAR_ELEVATION)
    })
  })

  // The point of the round-trip: the action the challenge interrupted has to
  // actually happen, not leave the user back in the app with nothing done.
  it('should complete the interrupted action on a successful return', async () => {
    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReplayPendingStepUpAction).toHaveBeenCalledWith(mockDispatch)
    })
  })

  it('should replay only after the session has been reconciled', async () => {
    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')
    const order: string[] = []
    mockReconcileAuth.mockImplementation(() => {
      order.push('reconcile')
      return Promise.resolve('authenticated')
    })
    mockReplayPendingStepUpAction.mockImplementation(() => {
      order.push('replay')
      return Promise.resolve()
    })

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(order).toEqual(['reconcile', 'replay'])
    })
  })

  it('should discard the interrupted action when the step-up failed', async () => {
    sessionStorage.setItem(STEP_UP_PENDING_KEY, '1')
    setSearch('?error=access_denied')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockClearPendingStepUpAction).toHaveBeenCalled()
    })
    expect(mockReplayPendingStepUpAction).not.toHaveBeenCalled()
  })
})
