import { renderHook, act } from '@/tests/test-utils'
import { useSignInRedirect } from '../useSignInRedirect'
import * as router from 'next/router'
import * as store from '@/store'
import { AppRoutes } from '@/config/routes'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = jest.fn(() => Promise.resolve(true))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/welcome',
    query: {},
    push: mockPush,
  })),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface DefaultProps {
  spacesAmount: number
  inviteAmount: number
  isSpacesLoading: boolean
  error: Error | undefined
}

const defaultProps: DefaultProps = {
  spacesAmount: 0,
  inviteAmount: 0,
  isSpacesLoading: false,
  error: undefined,
}

interface SetupOptions {
  isAuthenticated?: boolean
  routerQuery?: Record<string, string>
  props?: Partial<DefaultProps>
}

const setupMocks = ({ isAuthenticated = true, routerQuery = {} }: SetupOptions = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({
    pathname: '/welcome',
    query: routerQuery,
    push: mockPush,
  })

  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isAuthenticated ? Date.now() + 86400000 : null,
        lastUsedSpace: null,
        isStoreHydrated: true,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSignInRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return setHasSignedIn and redirectLoading', () => {
    setupMocks()

    const { result } = renderHook(() => useSignInRedirect(defaultProps))

    expect(result.current.setHasSignedIn).toBeDefined()
    expect(typeof result.current.setHasSignedIn).toBe('function')
    expect(result.current.redirectLoading).toBe(false)
  })

  // -----------------------------------------------------------------------
  // Redirect for new users (no spaces, no invites)
  // -----------------------------------------------------------------------

  describe('when user is new (no spaces, no invites)', () => {
    it('should redirect to create space page after sign-in', async () => {
      setupMocks()

      const { result } = renderHook(() => useSignInRedirect(defaultProps))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.createSpace,
        query: {},
      })
      expect(result.current.redirectLoading).toBe(true)
    })

    it('should preserve query parameters when redirecting to create space', async () => {
      setupMocks({ routerQuery: { chain: 'eth' } })

      const { result } = renderHook(() => useSignInRedirect(defaultProps))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.createSpace,
        query: { chain: 'eth' },
      })
    })
  })

  // -----------------------------------------------------------------------
  // Redirect when spaces endpoint returns 404
  // -----------------------------------------------------------------------

  describe('when spaces endpoint returns 404', () => {
    it('should redirect to create space page', async () => {
      setupMocks()
      const notFoundError = { status: 404, data: 'Not Found' } as unknown as Error

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, error: notFoundError }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.createSpace,
        query: {},
      })
    })
  })

  // -----------------------------------------------------------------------
  // No redirect when not signed in
  // -----------------------------------------------------------------------

  describe('when user has not signed in yet', () => {
    it('should not redirect if hasSignedIn is false', () => {
      setupMocks()

      renderHook(() => useSignInRedirect(defaultProps))

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // No redirect when user has spaces
  // -----------------------------------------------------------------------

  describe('when user has existing spaces', () => {
    it('should not redirect to create space page', async () => {
      setupMocks()

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, spacesAmount: 2 }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // No redirect when user has invites
  // -----------------------------------------------------------------------

  describe('when user has pending invites', () => {
    it('should not redirect to create space page', async () => {
      setupMocks()

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, inviteAmount: 1 }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // No redirect on non-404 errors
  // -----------------------------------------------------------------------

  describe('when there is a non-404 error', () => {
    it('should not redirect', async () => {
      setupMocks()
      const serverError = { status: 500, data: 'Server Error' } as unknown as Error

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, error: serverError }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // No redirect while spaces are loading
  // -----------------------------------------------------------------------

  describe('when spaces are still loading', () => {
    it('should not redirect', async () => {
      setupMocks()

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, isSpacesLoading: true }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
