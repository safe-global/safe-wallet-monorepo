import { renderHook, act } from '@testing-library/react'
import useLogout from '@/hooks/useLogout'
import { logError } from '@/services/exceptions'

const mockAuthLogoutWithRedirect = jest.fn().mockResolvedValue(undefined)

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useAuthLogoutWithRedirectV1Mutation: () => [mockAuthLogoutWithRedirect],
}))

const mockDispatch = jest.fn()
jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  setUnauthenticated: () => ({ type: 'auth/setUnauthenticated' }),
}))

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

describe('useLogout', () => {
  const originalLocation = window.location

  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, origin: 'http://localhost:3000' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should call authLogoutWithRedirect with the correct redirect URL', async () => {
    const { result } = renderHook(() => useLogout())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuthLogoutWithRedirect).toHaveBeenCalledWith({
      logoutDto: {
        redirect_url: 'http://localhost:3000/welcome/spaces',
      },
    })
  })

  it('should dispatch setUnauthenticated on success', async () => {
    const { result } = renderHook(() => useLogout())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setUnauthenticated' })
  })

  it('should log error when logout fails', async () => {
    const error = new Error('Network error')
    mockAuthLogoutWithRedirect.mockImplementationOnce(() => {
      throw error
    })

    const { result } = renderHook(() => useLogout())

    await act(async () => {
      await result.current.logout()
    })

    expect(logError).toHaveBeenCalledWith('109: Error signing out', error)
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
