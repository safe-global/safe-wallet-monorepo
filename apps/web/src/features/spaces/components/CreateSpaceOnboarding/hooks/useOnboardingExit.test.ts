import { renderHook, act } from '@testing-library/react'
import { AppRoutes } from '@/config/routes'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useOnboardingExit from './useOnboardingExit'

const mockPush = jest.fn()
const mockLogout = jest.fn()
const mockTrackEvent = jest.fn()

let mockIsSignedIn = true
let mockSpacesResult: { currentData: Array<{ id: number }> | undefined } = { currentData: undefined }

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/hooks/useLogout', () => ({
  __esModule: true,
  default: () => ({ logout: mockLogout }),
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector(undefined),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: () => mockIsSignedIn,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetV1Query: jest.fn(() => mockSpacesResult),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

describe('useOnboardingExit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSignedIn = true
    mockSpacesResult = { currentData: undefined }
  })

  it('logs out when the signed-in user has no spaces and is not editing', () => {
    mockSpacesResult = { currentData: [] }

    const { result } = renderHook(() => useOnboardingExit(false))

    expect(result.current.hasNoSpaces).toBe(true)
    act(() => result.current.onExit())

    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.AUTH_LOGGED_OUT, expect.any(Object))
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('treats undefined spaces (not yet loaded) as no spaces', () => {
    mockSpacesResult = { currentData: undefined }

    const { result } = renderHook(() => useOnboardingExit(false))

    expect(result.current.hasNoSpaces).toBe(true)
  })

  it('navigates to the workspace list when the user has spaces', () => {
    mockSpacesResult = { currentData: [{ id: 1 }] }

    const { result } = renderHook(() => useOnboardingExit(false))

    expect(result.current.hasNoSpaces).toBe(false)
    act(() => result.current.onExit())

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    expect(mockLogout).not.toHaveBeenCalled()
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('navigates instead of logging out in edit mode, even with no spaces', () => {
    mockSpacesResult = { currentData: [] }

    const { result } = renderHook(() => useOnboardingExit(true))

    expect(result.current.hasNoSpaces).toBe(false)
    act(() => result.current.onExit())

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('navigates instead of logging out when the user is signed out', () => {
    mockIsSignedIn = false
    mockSpacesResult = { currentData: [] }

    const { result } = renderHook(() => useOnboardingExit(false))

    expect(result.current.hasNoSpaces).toBe(false)
    act(() => result.current.onExit())

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    expect(mockLogout).not.toHaveBeenCalled()
  })
})
