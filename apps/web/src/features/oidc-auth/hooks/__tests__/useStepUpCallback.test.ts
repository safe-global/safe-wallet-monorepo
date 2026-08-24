import { renderHook, waitFor } from '@testing-library/react'
import { useStepUpCallback } from '../useStepUpCallback'
import { STEP_UP_FAILED_MESSAGE } from '../../constants'
import { stepUpReturning, stepUpSettled } from '../../store'
import { saveStepUpTrip } from '../../utils/stepUpReplay'

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

const mockReplayStepUpAction = jest.fn()
const mockMarkStepUpReturnHandled = jest.fn()
const mockResetStepUpReturnGuard = jest.fn()

jest.mock('../../utils/stepUp', () => ({
  markStepUpReturnHandled: () => mockMarkStepUpReturnHandled(),
  resetStepUpReturnGuard: () => mockResetStepUpReturnGuard(),
}))

// The storage half stays real: these tests assert the resulting sessionStorage
// state rather than which helper was called.
jest.mock('../../utils/stepUpReplay', () => ({
  ...jest.requireActual('../../utils/stepUpReplay'),
  replayStepUpAction: (...args: unknown[]) => mockReplayStepUpAction(...args),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/spaces/members',
    replace: mockReplace,
  }),
}))

const TRIP_ACTION = { endpoint: 'membersInviteUserV1', args: { spaceId: '7' } } as const

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
    mockReplayStepUpAction.mockResolvedValue(undefined)
    setSearch('')
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should do nothing when no trip is in flight', async () => {
    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).not.toHaveBeenCalled()
    })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should reconcile the session on a successful return', async () => {
    saveStepUpTrip(TRIP_ACTION)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledTimes(1)
    })
  })

  // Regression: the in-flight marker and the payload lived in separate keys, so
  // a return could consume one and strand the other for an unrelated trip to
  // execute. One record cannot disagree with itself.
  it('should consume the whole trip record so nothing is left behind', async () => {
    saveStepUpTrip(TRIP_ACTION)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
    })
  })

  it('should notify and clean the URL when the provider returned an error', async () => {
    saveStepUpTrip(TRIP_ACTION)
    setSearch('?spaceId=42&error=access_denied&error_description=mfa_required')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/showNotification',
        payload: { message: STEP_UP_FAILED_MESSAGE, variant: 'error', groupKey: 'step-up-failed' },
      })
    })

    expect(mockReconcileAuth).not.toHaveBeenCalled()
    expect(mockReplayStepUpAction).not.toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/spaces/members', query: { spaceId: '42' } }, undefined, {
      shallow: true,
    })
  })

  // Without this, an `elevation_required` raised by the replayed action would
  // send the user straight back out to the provider, on and on.
  it('should hold the redirect guard while processing and release it after the replay', async () => {
    saveStepUpTrip(TRIP_ACTION)
    const order: string[] = []
    mockMarkStepUpReturnHandled.mockImplementation(() => order.push('mark'))
    mockReplayStepUpAction.mockImplementation(() => {
      order.push('replay')
      return Promise.resolve()
    })
    mockResetStepUpReturnGuard.mockImplementation(() => order.push('reset'))

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(order).toEqual(['mark', 'replay', 'reset'])
    })
  })

  // The first render races the replay: without the splash held up, lists paint
  // pre-mutation data next to a success toast, then visibly jump.
  it('should hold the splash until the return is fully processed', async () => {
    saveStepUpTrip(TRIP_ACTION)
    let resolveReplay: () => void = () => {}
    mockReplayStepUpAction.mockImplementation(() => new Promise<void>((resolve) => (resolveReplay = resolve)))

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(stepUpReturning())
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(stepUpSettled())

    resolveReplay()

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(stepUpSettled())
    })
  })

  // Regression: the guard once stayed set for the whole SPA session, so the
  // second gated action after a step-up silently never redirected.
  it('should release the redirect guard after a failed challenge too', async () => {
    saveStepUpTrip(TRIP_ACTION)
    setSearch('?error=access_denied')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockResetStepUpReturnGuard).toHaveBeenCalledTimes(1)
    })
  })

  // Regression: a throw (e.g. the gateway unreachable during the return) once
  // skipped the release, so no step-up in the tab could redirect again until a
  // full reload.
  it('should release the redirect guard even when processing the return throws', async () => {
    saveStepUpTrip(TRIP_ACTION)
    mockReconcileAuth.mockRejectedValue(new Error('fetch failed'))

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockResetStepUpReturnGuard).toHaveBeenCalledTimes(1)
    })
  })

  // The point of the round-trip: the action the challenge interrupted has to
  // actually happen, not leave the user back in the app with nothing done.
  it('should complete the interrupted action on a successful return', async () => {
    saveStepUpTrip(TRIP_ACTION)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReplayStepUpAction).toHaveBeenCalledWith(mockDispatch, TRIP_ACTION)
    })
  })

  // A gated endpoint outside the replay allowlist records a bare trip: the
  // session is still reconciled, but nothing is re-fired blindly.
  it('should reconcile without replaying on a bare trip', async () => {
    saveStepUpTrip(undefined)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledTimes(1)
    })
    expect(mockReplayStepUpAction).not.toHaveBeenCalled()
  })

  it('should replay only after the session has been reconciled', async () => {
    saveStepUpTrip(TRIP_ACTION)
    const order: string[] = []
    mockReconcileAuth.mockImplementation(() => {
      order.push('reconcile')
      return Promise.resolve('authenticated')
    })
    mockReplayStepUpAction.mockImplementation(() => {
      order.push('replay')
      return Promise.resolve()
    })

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(order).toEqual(['reconcile', 'replay'])
    })
  })

  it('should discard the interrupted action when the step-up failed', async () => {
    saveStepUpTrip(TRIP_ACTION)
    setSearch('?error=access_denied')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
    })
    expect(mockReplayStepUpAction).not.toHaveBeenCalled()
  })
})
