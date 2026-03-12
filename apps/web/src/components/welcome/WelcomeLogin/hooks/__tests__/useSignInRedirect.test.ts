import { renderHook, act } from '@/tests/test-utils'
import { useSignInRedirect } from '../useSignInRedirect'
import * as router from 'next/router'
import * as store from '@/store'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { setLastUsedSpace } from '@/store/authSlice'
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

const mockTriggerSpacesQuery = jest.fn()
const mockDispatch = jest.fn()

interface SetupOptions {
  currentSpaceId?: string | null
  isAuthenticated?: boolean
  reactiveSpaces?: Array<{ id: number; name: string }> | undefined
  routerQuery?: Record<string, string>
}

const setupMocks = ({
  currentSpaceId = null,
  isAuthenticated = true,
  reactiveSpaces = undefined,
  routerQuery = {},
}: SetupOptions = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({
    pathname: '/welcome',
    query: routerQuery,
    push: mockPush,
  })

  jest.spyOn(store, 'useAppDispatch').mockReturnValue(mockDispatch)
  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isAuthenticated ? Date.now() + 86400000 : null,
        lastUsedSpace: currentSpaceId,
        isStoreHydrated: true,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })

  jest.spyOn(spacesQueries, 'useSpacesGetV1Query').mockReturnValue({
    data: reactiveSpaces,
  } as unknown as ReturnType<typeof spacesQueries.useSpacesGetV1Query>)

  jest
    .spyOn(spacesQueries, 'useLazySpacesGetV1Query')
    .mockReturnValue([mockTriggerSpacesQuery] as unknown as ReturnType<typeof spacesQueries.useLazySpacesGetV1Query>)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSignInRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return redirect function and spaces data', () => {
    setupMocks()

    const { result } = renderHook(() => useSignInRedirect())

    expect(result.current.redirect).toBeDefined()
    expect(typeof result.current.redirect).toBe('function')
    expect(result.current.spaces).toBeUndefined()
  })

  it('should return reactive spaces when authenticated', () => {
    const spaces = [{ id: 1, name: 'My Space' }]
    setupMocks({ isAuthenticated: true, reactiveSpaces: spaces })

    const { result } = renderHook(() => useSignInRedirect())

    expect(result.current.spaces).toEqual(spaces)
  })

  // -----------------------------------------------------------------------
  // Redirect when user has no spaces
  // -----------------------------------------------------------------------

  describe('when user has no spaces', () => {
    it('should redirect to create space page when spaces are empty', async () => {
      setupMocks()
      mockTriggerSpacesQuery.mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useSignInRedirect())

      await act(async () => {
        await result.current.redirect()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.createSpace,
        query: {},
      })
    })

    it('should redirect to create space page when spaces data is undefined', async () => {
      setupMocks()
      mockTriggerSpacesQuery.mockResolvedValue({ data: undefined })

      const { result } = renderHook(() => useSignInRedirect())

      await act(async () => {
        await result.current.redirect()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.createSpace,
        query: {},
      })
    })

    it('should preserve query parameters when redirecting to create space', async () => {
      setupMocks({ routerQuery: { chain: 'eth' } })
      mockTriggerSpacesQuery.mockResolvedValue({ data: [] })

      const { result } = renderHook(() => useSignInRedirect())

      await act(async () => {
        await result.current.redirect()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.createSpace,
        query: { chain: 'eth' },
      })
    })
  })

  // -----------------------------------------------------------------------
  // Redirect when user has spaces but no last used space
  // -----------------------------------------------------------------------

  describe('when user has spaces but no last used space', () => {
    it('should redirect to the first space and set it as last used', async () => {
      const spaces = [
        { id: 10, name: 'First Space' },
        { id: 20, name: 'Second Space' },
      ]
      setupMocks({ currentSpaceId: null })
      mockTriggerSpacesQuery.mockResolvedValue({ data: spaces })

      const { result } = renderHook(() => useSignInRedirect())

      await act(async () => {
        await result.current.redirect()
      })

      expect(mockDispatch).toHaveBeenCalledWith(setLastUsedSpace('10'))
      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: '10' },
      })
    })
  })

  // -----------------------------------------------------------------------
  // Redirect when user has spaces and a valid last used space
  // -----------------------------------------------------------------------

  describe('when user has spaces and a valid last used space', () => {
    it('should redirect to the last used space', async () => {
      const spaces = [
        { id: 10, name: 'First Space' },
        { id: 20, name: 'Second Space' },
      ]
      setupMocks({ currentSpaceId: '20' })
      mockTriggerSpacesQuery.mockResolvedValue({ data: spaces })

      const { result } = renderHook(() => useSignInRedirect())

      await act(async () => {
        await result.current.redirect()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: '20' },
      })
      // Should NOT dispatch setLastUsedSpace since it is already correct
      expect(mockDispatch).not.toHaveBeenCalledWith(setLastUsedSpace(expect.anything()))
    })
  })

  // -----------------------------------------------------------------------
  // Redirect when last used space is no longer valid
  // -----------------------------------------------------------------------

  describe('when last used space is no longer valid', () => {
    it('should fall back to the first space and update last used', async () => {
      const spaces = [
        { id: 10, name: 'First Space' },
        { id: 20, name: 'Second Space' },
      ]
      setupMocks({ currentSpaceId: '999' })
      mockTriggerSpacesQuery.mockResolvedValue({ data: spaces })

      const { result } = renderHook(() => useSignInRedirect())

      await act(async () => {
        await result.current.redirect()
      })

      expect(mockDispatch).toHaveBeenCalledWith(setLastUsedSpace('10'))
      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: '10' },
      })
    })
  })

  // -----------------------------------------------------------------------
  // Query parameter preservation
  // -----------------------------------------------------------------------

  describe('query parameter preservation', () => {
    it('should preserve existing query parameters when redirecting to spaces', async () => {
      const spaces = [{ id: 5, name: 'Space' }]
      setupMocks({ currentSpaceId: null, routerQuery: { safe: 'eth:0x123' } })
      mockTriggerSpacesQuery.mockResolvedValue({ data: spaces })

      const { result } = renderHook(() => useSignInRedirect())

      await act(async () => {
        await result.current.redirect()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.spaces.index,
        query: { safe: 'eth:0x123', spaceId: '5' },
      })
    })
  })
})
