import { renderHook, act } from '@/tests/test-utils'
import { useSignInRedirect } from '../useSignInRedirect'
import * as router from 'next/router'
import * as store from '@/store'
import { AppRoutes } from '@/config/routes'
import * as useIsRequireLoginEnabledModule from '@/hooks/useIsRequireLoginEnabled'

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: jest.fn(() => false),
}))

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
  isOidcLoginPending?: boolean
  routerQuery?: Record<string, string>
  props?: Partial<DefaultProps>
}

const setupMocks = ({ isAuthenticated = true, isOidcLoginPending = false, routerQuery = {} }: SetupOptions = {}) => {
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
        isOidcLoginPending,
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

    // Regression: re-login after logout used to bounce existing users into the
    // create-space flow because on the render where sign-in completed the
    // spaces query was still in the skip→unskip transition (isFetching=false,
    // currentData=undefined) and the hook read spacesAmount=0. The fix is at
    // the SpacesList call site (isSpacesLoading: isFetching || isUninitialized),
    // and this test pins the contract: while loading, no redirect — even with
    // spacesAmount=0 and hasSignedIn=true.
    it('does not redirect when isSpacesLoading=true even if spacesAmount is 0', async () => {
      setupMocks()

      const { result } = renderHook(() =>
        useSignInRedirect({ ...defaultProps, spacesAmount: 0, isSpacesLoading: true }),
      )

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('when OIDC sign-in completes', () => {
    it('should redirect new users to create space page after OIDC login', async () => {
      // Start with OIDC login pending
      const useAppSelectorSpy = jest.spyOn(store, 'useAppSelector')

      setupMocks({ isAuthenticated: false, isOidcLoginPending: true })

      const { rerender } = renderHook(() => useSignInRedirect(defaultProps))

      expect(mockPush).not.toHaveBeenCalled()

      // Simulate OIDC callback completing: pending → false, authenticated → true
      useAppSelectorSpy.mockImplementation((selector) => {
        const fakeState = {
          auth: {
            sessionExpiresAt: Date.now() + 86400000,
            lastUsedSpace: null,
            isStoreHydrated: true,
            isOidcLoginPending: false,
          },
        }
        return selector(fakeState as unknown as store.RootState)
      })

      await act(async () => {
        rerender()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.createSpace,
        query: {},
      })
    })

    it('should not redirect if OIDC login was never pending', async () => {
      setupMocks({ isAuthenticated: true, isOidcLoginPending: false })

      renderHook(() => useSignInRedirect(defaultProps))

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // Require-login gate (REQUIRE_LOGIN_DISABLED off → gate ON)
  // -----------------------------------------------------------------------

  describe('require-login gate enabled', () => {
    beforeEach(() => {
      ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(true)
    })

    afterEach(() => {
      ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(false)
    })

    it('redirects an existing user with spaces to ?next= after sign-in', async () => {
      setupMocks({ routerQuery: { next: '/balances' } })

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, spacesAmount: 2 }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/balances', query: {} })
      expect(result.current.redirectLoading).toBe(true)
    })

    it('does not redirect an existing user when next is missing (stays on /welcome/spaces, which is the Spaces list)', async () => {
      setupMocks()

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, spacesAmount: 2 }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('does not redirect when next is unsafe (protocol-relative)', async () => {
      setupMocks({ routerQuery: { next: '//evil.com/owned' } })

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, spacesAmount: 2 }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('waits for the gate flag to resolve before redirecting to next', async () => {
      ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(undefined)
      setupMocks({ routerQuery: { next: '/balances' } })

      const { result, rerender } = renderHook(() => useSignInRedirect({ ...defaultProps, spacesAmount: 2 }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
      ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(true)
      await act(async () => {
        rerender()
      })

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/balances', query: {} })
    })
  })
})
