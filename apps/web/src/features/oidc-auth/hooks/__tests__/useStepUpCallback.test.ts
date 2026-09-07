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
    mockDispatch.mockImplementation((action) => action)
    sessionStorage.clear()
    mockReconcileAuth.mockResolvedValue('authenticated')
    mockReplayStepUpAction.mockResolvedValue(undefined)
    setSearch('')
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should, when no trip is in flight, do nothing', async () => {
    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).not.toHaveBeenCalled()
    })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should, when the return succeeds, reconcile the session', async () => {
    saveStepUpTrip(TRIP_ACTION)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledTimes(1)
    })
  })

  it('should, when a trip is processed, consume the whole record so nothing is left behind', async () => {
    saveStepUpTrip(TRIP_ACTION)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
    })
  })

  it('should, when the callback carries an error, notify and clean the URL', async () => {
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

  it('should, when processing a return, enter `returning` before the replay and settle after it', async () => {
    saveStepUpTrip(TRIP_ACTION)
    const order: string[] = []
    mockDispatch.mockImplementation((action: { type: string }) => {
      if (action.type === stepUpReturning().type) order.push('returning')
      if (action.type === stepUpSettled().type) order.push('settled')
      return action
    })
    mockReplayStepUpAction.mockImplementation(() => {
      order.push('replay')
      return Promise.resolve()
    })

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(order).toEqual(['returning', 'replay', 'settled'])
    })
  })

  it('should, when a return is in flight, hold the splash until it is fully processed', async () => {
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

  it('should, when the challenge failed, still settle', async () => {
    saveStepUpTrip(TRIP_ACTION)
    setSearch('?error=access_denied')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(stepUpSettled())
    })
  })

  it('should, when processing the return throws, still settle', async () => {
    saveStepUpTrip(TRIP_ACTION)
    mockReconcileAuth.mockRejectedValue(new Error('fetch failed'))

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(stepUpSettled())
    })
  })

  it('should, when the return succeeds, complete the interrupted action', async () => {
    saveStepUpTrip(TRIP_ACTION)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReplayStepUpAction).toHaveBeenCalledWith(mockDispatch, TRIP_ACTION)
    })
  })

  it('should, when the trip is bare, reconcile without replaying', async () => {
    saveStepUpTrip(undefined)

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledTimes(1)
    })
    expect(mockReplayStepUpAction).not.toHaveBeenCalled()
  })

  it('should, when replaying, do so only after the session has been reconciled', async () => {
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

  it('should, when the step-up failed, discard the interrupted action', async () => {
    saveStepUpTrip(TRIP_ACTION)
    setSearch('?error=access_denied')

    renderHook(() => useStepUpCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
    })
    expect(mockReplayStepUpAction).not.toHaveBeenCalled()
  })
})
