import { renderHook } from '@/tests/test-utils'
import { useFlowActivationGuard } from '../useFlowActivationGuard'
import * as router from 'next/router'
import * as store from '@/store'
import * as useWalletModule from '@/hooks/wallets/useWallet'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import * as useIsSpaceRouteModule from '@/hooks/useIsSpaceRoute'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const MOCK_SPACE_UUID_ALT = '22222222-2222-2222-2222-222222222222'

const UNKNOWN_SPACE_UUID = '99999999-9999-9999-9999-999999999999'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/home',
    query: {},
  })),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(() => false),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFetchSpaces = jest.fn()

interface SetupOptions {
  pathname?: string
  query?: Record<string, string>
  wallet?: unknown | null
  walletContext?: { isReady: boolean } | null
  isAuthenticated?: boolean
  isStoreHydrated?: boolean
  spaces?: Array<{ id: number; uuid: string; name: string }> | undefined
  isSpaceRoute?: boolean
}

const defaultSpaces = [
  { id: 1, uuid: MOCK_SPACE_UUID, name: 'Space 1' },
  { id: 2, uuid: MOCK_SPACE_UUID_ALT, name: 'Space 2' },
]

const setupMocks = ({
  pathname = '/home',
  query = {},
  wallet = { address: '0x123' },
  walletContext = { isReady: true },
  isAuthenticated = true,
  isStoreHydrated = true,
  spaces = defaultSpaces,
  isSpaceRoute = false,
}: SetupOptions = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ pathname, query, isReady: true })
  ;(useIsSpaceRouteModule.useIsSpaceRoute as jest.Mock).mockReturnValue(isSpaceRoute)

  jest.spyOn(useWalletModule, 'default').mockReturnValue(wallet as ReturnType<typeof useWalletModule.default>)
  jest
    .spyOn(useWalletModule, 'useWalletContext')
    .mockReturnValue(walletContext as ReturnType<typeof useWalletModule.useWalletContext>)

  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isAuthenticated ? Date.now() + 86400000 : null,
        lastUsedSpace: null,
        isStoreHydrated,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })

  jest
    .spyOn(spacesQueries, 'useLazySpacesGetV1Query')
    .mockReturnValue([mockFetchSpaces] as unknown as ReturnType<typeof spacesQueries.useLazySpacesGetV1Query>)

  mockFetchSpaces.mockResolvedValue({ data: spaces })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFlowActivationGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Public routes
  // -----------------------------------------------------------------------

  describe('public routes', () => {
    it('should allow access to /terms', async () => {
      setupMocks({ pathname: AppRoutes.terms, wallet: null, isAuthenticated: false })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should allow access to /welcome', async () => {
      setupMocks({ pathname: AppRoutes.welcome.index, wallet: null, isAuthenticated: false })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should allow access to /404', async () => {
      setupMocks({ pathname: AppRoutes['404'], wallet: null, isAuthenticated: false })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should allow access to /privacy', async () => {
      setupMocks({ pathname: AppRoutes.privacy, wallet: null, isAuthenticated: false })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })
  })

  // -----------------------------------------------------------------------
  // Wallet provider not ready
  // -----------------------------------------------------------------------

  describe('wallet provider not ready', () => {
    it('should allow access when wallet provider is not ready', async () => {
      setupMocks({
        pathname: '/home',
        walletContext: { isReady: false },
        wallet: null,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should allow access when store is not hydrated', async () => {
      setupMocks({
        pathname: '/home',
        walletContext: { isReady: true },
        isStoreHydrated: false,
        wallet: null,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })
  })

  // -----------------------------------------------------------------------
  // Not connected / not authenticated
  // -----------------------------------------------------------------------

  describe('not connected or not authenticated', () => {
    it('should allow access when wallet is not connected but SIWE authenticated', async () => {
      setupMocks({
        pathname: '/home',
        wallet: null,
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should allow access when not authenticated on a public route (no redirect)', async () => {
      setupMocks({
        pathname: '/home',
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })
  })

  // -----------------------------------------------------------------------
  // Spaces path without SIWE authentication → redirect to /welcome/spaces
  // -----------------------------------------------------------------------

  describe('spaces path without authentication', () => {
    it('should redirect to welcome/spaces when not authenticated on /spaces', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.index,
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })

    it('should redirect to welcome/spaces when not authenticated on /spaces/settings', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.settings,
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })

    it('should redirect to welcome/spaces when not authenticated on /spaces/members', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.members,
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })

    it('should allow when store is not hydrated even on /spaces (no redirect before hydration)', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.index,
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: false,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should preserve ?safe= in the welcome/spaces redirect when unauthenticated on a spaces path', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.createSpace,
        query: { safe: '1:0xdeadbeef' },
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({
        success: false,
        redirectTo: `${AppRoutes.welcome.spaces}?safe=1%3A0xdeadbeef`,
      })
    })

    it('should preserve ?safe= in the welcome redirect when unauthenticated on a non-spaces route', async () => {
      setupMocks({
        pathname: '/other',
        query: { safe: '5:0xcafe' },
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({
        success: false,
        redirectTo: `${AppRoutes.welcome.spaces}?safe=5%3A0xcafe`,
      })
    })

    it('should not append ?safe= when safe query param is not a string', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.createSpace,
        query: { safe: ['a', 'b'] } as unknown as Record<string, string>,
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })
  })

  // -----------------------------------------------------------------------
  // Authenticated but no spaces
  // -----------------------------------------------------------------------

  describe('authenticated but no spaces', () => {
    it('should redirect to create space when user has no spaces', async () => {
      setupMocks({ pathname: AppRoutes.spaces.index, spaces: [], isSpaceRoute: true })
    })

    it('should allow access to home when user has no spaces (home is a public route)', async () => {
      setupMocks({ pathname: '/home', spaces: [] })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should allow access to onboarding route when user has no spaces', async () => {
      setupMocks({ pathname: AppRoutes.welcome.createSpace, spaces: [] })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should allow access to select safes onboarding route when user has no spaces', async () => {
      setupMocks({ pathname: AppRoutes.welcome.selectSafes, spaces: [] })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should preserve ?safe= when redirecting to create space onboarding', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.createSpace,
        query: { safe: '1:0xdeadbeef' },
        spaces: [],
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({
        success: false,
        redirectTo: `${AppRoutes.welcome.createSpace}?safe=1%3A0xdeadbeef`,
      })
    })

    it('should not append ?safe= to onboarding redirect when safe param is absent', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.createSpace,
        query: {},
        spaces: [],
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({
        success: false,
        redirectTo: AppRoutes.welcome.createSpace,
      })
    })

    // Regression: after a logout the persisted authSlice still says
    // "signed in" until reconcileAuth resolves, so the guard runs with
    // isSiweAuthenticated=true while the cookies have already been cleared.
    // fetchSpaces then resolves with a 401/403 error and data=undefined —
    // the old code treated that as "no spaces" and bounced the user into
    // /welcome/create-space. The guard must instead treat transient/auth
    // errors as "uncertain" and let the page render.
    it('should NOT redirect to create-space when the spaces fetch errors with 403 (cookies cleared post-logout)', async () => {
      setupMocks({ pathname: AppRoutes.spaces.index, isSpaceRoute: true })
      mockFetchSpaces.mockResolvedValueOnce({ data: undefined, error: { status: 403, data: 'Forbidden' } })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult.success).not.toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // Authenticated with spaces but navigating to onboarding without spaceId
  // -----------------------------------------------------------------------

  describe('authenticated with spaces on onboarding routes', () => {
    it('should redirect to spaces create page when navigating to onboarding without spaceId', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.createSpace,
        query: {},
        spaces: defaultSpaces,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.spaces.createSpace })
    })

    it('should preserve ?safe= when redirecting to spaces create page', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.createSpace,
        query: { safe: '1:0xdeadbeef' },
        spaces: defaultSpaces,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({
        success: false,
        redirectTo: `${AppRoutes.spaces.createSpace}?safe=1%3A0xdeadbeef`,
      })
    })

    it('should allow onboarding route when spaceId is present', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.createSpace,
        query: { spaceId: MOCK_SPACE_UUID },
        spaces: defaultSpaces,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })
  })

  // -----------------------------------------------------------------------
  // Authenticated with valid space URL
  // -----------------------------------------------------------------------

  describe('authenticated with valid space URL', () => {
    it('should allow access when user has a valid spaceId in query', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: MOCK_SPACE_UUID },
        spaces: defaultSpaces,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('should redirect to welcome when spaceId does not match any user space on space route', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: UNKNOWN_SPACE_UUID },
        spaces: defaultSpaces,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })

    it('should redirect to welcome when spaceId is a legacy numeric id (uuid-only matching)', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: String(defaultSpaces[0].id) },
        spaces: defaultSpaces,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })
  })

  // -----------------------------------------------------------------------
  // No spaceId on a non-public, non-onboarding route
  // -----------------------------------------------------------------------

  describe('no valid space selected', () => {
    it('should allow access when no spaceId is in the query (isPartOfSpaceUrl defaults to true)', async () => {
      setupMocks({
        pathname: '/home',
        query: {},
        spaces: defaultSpaces,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      // When no spaceId is in the query, isPartOfSpaceUrl defaults to true
      // so the guard does not redirect
      expect(guardResult).toEqual({ success: true })
    })

    it('should redirect to welcome when spaceId in query is not part of user spaces on space route', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: UNKNOWN_SPACE_UUID },
        spaces: defaultSpaces,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })
  })

  // -----------------------------------------------------------------------
  // Spaces fetch behavior
  // -----------------------------------------------------------------------

  describe('spaces fetching', () => {
    it('should not fetch spaces when not authenticated', async () => {
      setupMocks({
        pathname: '/home',
        wallet: { address: '0x123' },
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      await result.current.activationGuard()

      expect(mockFetchSpaces).not.toHaveBeenCalled()
    })

    it('should fetch spaces when authenticated', async () => {
      setupMocks({ pathname: '/spaces', query: { spaceId: MOCK_SPACE_UUID } })

      const { result } = renderHook(() => useFlowActivationGuard())
      await result.current.activationGuard()

      expect(mockFetchSpaces).toHaveBeenCalledWith(undefined)
    })
  })
})
