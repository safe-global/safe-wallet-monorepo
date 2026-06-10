import type { AppDispatch } from '@/store'
import reconcileAuth from '@/store/reconcileAuth'

const mockUnwrap = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  cgwApi: {
    endpoints: {
      authGetMeV1: {
        initiate: () => 'initiate-thunk',
      },
    },
  },
}))

jest.mock('@/store/authSlice', () => ({
  setAuthenticated: (val: number) => ({ type: 'auth/setAuthenticated', payload: val }),
  setUnauthenticated: () => ({ type: 'auth/setUnauthenticated' }),
}))

describe('reconcileAuth', () => {
  const mockDispatch = jest.fn((action) => {
    if (action === 'initiate-thunk') return { unwrap: mockUnwrap }
    return action
  }) as unknown as AppDispatch & jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Date, 'now').mockReturnValue(1000000)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return "authenticated" and set authenticated when /v1/auth/me succeeds', async () => {
    mockUnwrap.mockResolvedValue({ email: 'test@example.com' })

    const result = await reconcileAuth(mockDispatch)

    expect(result).toBe('authenticated')
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/setAuthenticated',
      payload: 1000000 + 24 * 60 * 60 * 1000,
    })
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'auth/setUnauthenticated' })
  })

  it('should return "unauthenticated" and set unauthenticated when /v1/auth/me returns 403', async () => {
    mockUnwrap.mockRejectedValue({ status: 403, data: 'Forbidden' })

    const result = await reconcileAuth(mockDispatch)

    expect(result).toBe('unauthenticated')
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setUnauthenticated' })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setAuthenticated' }))
  })

  it('should return "error" and not clear auth state on transient errors', async () => {
    mockUnwrap.mockRejectedValue({ status: 500, data: 'Internal Server Error' })

    const result = await reconcileAuth(mockDispatch)

    expect(result).toBe('error')
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'auth/setUnauthenticated' })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setAuthenticated' }))
  })

  it('should return "error" and not clear auth state on network errors', async () => {
    mockUnwrap.mockRejectedValue(new Error('Failed to fetch'))

    const result = await reconcileAuth(mockDispatch)

    expect(result).toBe('error')
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'auth/setUnauthenticated' })
  })
})
