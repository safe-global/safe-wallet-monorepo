import { renderHook, act } from '@/tests/test-utils'
import { useSignInRedirect } from '../useSignInRedirect'
import * as router from 'next/router'
import * as store from '@/store'

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
  // New users (no spaces) are no longer pushed into the create-workspace flow
  // -----------------------------------------------------------------------

  describe('when user is new (no spaces)', () => {
    it('does not redirect after sign-in (they stay on the Workspaces tab)', async () => {
      setupMocks()

      const { result } = renderHook(() => useSignInRedirect(defaultProps))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
      expect(result.current.redirectLoading).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // No redirect when the spaces endpoint errors (incl. 404)
  // -----------------------------------------------------------------------

  describe('when the spaces endpoint returns 404', () => {
    it('does not redirect', async () => {
      setupMocks()
      const notFoundError = { status: 404, data: 'Not Found' } as unknown as Error

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, error: notFoundError }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
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
    it('jumps a single-space user to their space after OIDC login', async () => {
      // Start with OIDC login pending
      const useAppSelectorSpy = jest.spyOn(store, 'useAppSelector')

      setupMocks({ isAuthenticated: false, isOidcLoginPending: true })

      const { rerender } = renderHook(() =>
        useSignInRedirect({ ...defaultProps, spacesAmount: 1, singleSpaceId: 'space-42' }),
      )

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

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: 'space-42' } })
    })

    it('should not redirect if OIDC login was never pending', async () => {
      setupMocks({ isAuthenticated: true, isOidcLoginPending: false })

      renderHook(() => useSignInRedirect(defaultProps))

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // Single-space short-circuit
  // -----------------------------------------------------------------------

  describe('when the user has exactly one space', () => {
    it('redirects to that space after sign-in instead of the workspace list', async () => {
      setupMocks()

      const { result } = renderHook(() =>
        useSignInRedirect({ ...defaultProps, spacesAmount: 1, singleSpaceId: 'space-42' }),
      )

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: 'space-42' } })
      expect(result.current.redirectLoading).toBe(true)
    })

    it('does not redirect to the single space when there is a pending invite', async () => {
      setupMocks()

      const { result } = renderHook(() =>
        useSignInRedirect({ ...defaultProps, spacesAmount: 1, inviteAmount: 1, singleSpaceId: 'space-42' }),
      )

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('still redirects to the single space when there are no invites', async () => {
      setupMocks()

      const { result } = renderHook(() =>
        useSignInRedirect({ ...defaultProps, spacesAmount: 1, inviteAmount: 0, singleSpaceId: 'space-42' }),
      )

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: 'space-42' } })
    })

    it('does not redirect when there are multiple spaces (no singleSpaceId)', async () => {
      setupMocks()

      const { result } = renderHook(() => useSignInRedirect({ ...defaultProps, spacesAmount: 3, singleSpaceId: null }))

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('does not short-circuit before the user has signed in', async () => {
      setupMocks()

      renderHook(() => useSignInRedirect({ ...defaultProps, spacesAmount: 1, singleSpaceId: 'space-42' }))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('does not short-circuit while spaces are still loading', async () => {
      setupMocks()

      const { result } = renderHook(() =>
        useSignInRedirect({
          ...defaultProps,
          spacesAmount: 1,
          isSpacesLoading: true,
          singleSpaceId: 'space-42',
        }),
      )

      await act(async () => {
        result.current.setHasSignedIn(true)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
