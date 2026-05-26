import { renderHook } from '@/tests/test-utils'
import { useFlowActivationGuard } from '../useFlowActivationGuard'
import * as router from 'next/router'
import * as store from '@/store'
import * as useWalletModule from '@/hooks/wallets/useWallet'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import * as useIsSpaceRouteModule from '@/hooks/useIsSpaceRoute'
import * as useIsRequireLoginEnabledModule from '@/hooks/useIsRequireLoginEnabled'

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

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: jest.fn(() => false),
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
  spaces?: Array<{ id: number; name: string }> | undefined
  isSpaceRoute?: boolean
  isRequireLoginEnabled?: boolean | undefined
}

const defaultSpaces = [
  { id: 1, name: 'Space 1' },
  { id: 2, name: 'Space 2' },
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
  isRequireLoginEnabled = false,
}: SetupOptions = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ pathname, query, isReady: true })
  ;(useIsSpaceRouteModule.useIsSpaceRoute as jest.Mock).mockReturnValue(isSpaceRoute)
  ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(isRequireLoginEnabled)

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
        redirectTo: `${AppRoutes.welcome.index}?safe=5%3A0xcafe`,
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
        query: { spaceId: '1' },
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
        query: { spaceId: '1' },
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
        query: { spaceId: '999' },
        spaces: defaultSpaces,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.index })
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
        query: { spaceId: '999' },
        spaces: defaultSpaces,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.index })
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
      setupMocks({ pathname: '/spaces', query: { spaceId: '1' } })

      const { result } = renderHook(() => useFlowActivationGuard())
      await result.current.activationGuard()

      expect(mockFetchSpaces).toHaveBeenCalledWith(undefined)
    })
  })

  // -----------------------------------------------------------------------
  // Require-login gate (REQUIRE_LOGIN_DISABLED feature flag is OFF)
  // -----------------------------------------------------------------------

  describe('require-login gate enabled', () => {
    it('redirects unauthenticated users from a protected route to /welcome/spaces with next=', async () => {
      setupMocks({
        pathname: '/home',
        query: { foo: 'bar' },
        isAuthenticated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult.success).toBe(false)
      expect(guardResult.redirectTo).toBe(`${AppRoutes.welcome.spaces}?next=${encodeURIComponent('/home?foo=bar')}`)
    })

    it('redirects unauthenticated users from /balances to /welcome/spaces with next=', async () => {
      setupMocks({
        pathname: AppRoutes.balances.index,
        isAuthenticated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({
        success: false,
        redirectTo: `${AppRoutes.welcome.spaces}?next=${encodeURIComponent(AppRoutes.balances.index)}`,
      })
    })

    it('keeps the safe= inside next= but does NOT duplicate it on the redirect target', async () => {
      setupMocks({
        pathname: '/balances',
        query: { safe: '1:0xabc' },
        isAuthenticated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      // safe is preserved inside the encoded next= URL, not as a top-level
      // duplicate on /welcome/spaces.
      expect(guardResult.redirectTo).toBe(
        `${AppRoutes.welcome.spaces}?next=${encodeURIComponent('/balances?safe=1%3A0xabc')}`,
      )
    })

    it('does NOT redirect when on the login page itself', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.spaces,
        isAuthenticated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('allows the legal static pages even when unauthenticated', async () => {
      for (const pathname of [
        AppRoutes.terms,
        AppRoutes.privacy,
        AppRoutes.cookie,
        AppRoutes.imprint,
        AppRoutes.licenses,
        AppRoutes['404'],
      ]) {
        setupMocks({ pathname, isAuthenticated: false, isRequireLoginEnabled: true })
        const { result } = renderHook(() => useFlowActivationGuard())
        const guardResult = await result.current.activationGuard()
        expect(guardResult).toEqual({ success: true })
      }
    })

    it('redirects an authenticated user with no spaces to the onboarding page (carrying next)', async () => {
      setupMocks({
        pathname: '/balances',
        isAuthenticated: true,
        spaces: [],
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult.redirectTo).toBe(
        `${AppRoutes.welcome.createSpace}?next=${encodeURIComponent(AppRoutes.balances.index)}`,
      )
    })

    it('does NOT redirect when on the onboarding page with no spaces (lets the user finish onboarding)', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.createSpace,
        isAuthenticated: true,
        spaces: [],
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('does NOT redirect signed-in users with no spaces away from legal/static pages', async () => {
      for (const pathname of [
        AppRoutes.terms,
        AppRoutes.privacy,
        AppRoutes.cookie,
        AppRoutes.licenses,
        AppRoutes['404'],
      ]) {
        setupMocks({ pathname, isAuthenticated: true, spaces: [], isRequireLoginEnabled: true })
        const { result } = renderHook(() => useFlowActivationGuard())
        const guardResult = await result.current.activationGuard()
        expect(guardResult).toEqual({ success: true })
      }
    })

    it('forwards an authenticated user with spaces from the login page to ?next=', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.spaces,
        query: { next: '/balances' },
        isAuthenticated: true,
        spaces: defaultSpaces,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: '/balances' })
    })

    it('lets an authenticated user with spaces stay on the login page (which is the Spaces list) when there is no next=', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.spaces,
        isAuthenticated: true,
        spaces: defaultSpaces,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('redirects unauthenticated users even when the wallet system is not ready yet', async () => {
      setupMocks({
        pathname: '/home',
        walletContext: { isReady: false },
        wallet: null,
        isAuthenticated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult.success).toBe(false)
      expect(guardResult.redirectTo).toBe(`${AppRoutes.welcome.spaces}?next=${encodeURIComponent(AppRoutes.home)}`)
    })

    it('does not run legacy redirects while the gate flag is still loading (undefined)', async () => {
      setupMocks({
        pathname: '/home',
        isAuthenticated: false,
        isRequireLoginEnabled: undefined,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('redirects an unauthenticated user on an onboarding route to /welcome/spaces (not /welcome)', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.createSpace,
        isAuthenticated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({
        success: false,
        redirectTo: `${AppRoutes.welcome.spaces}?next=${encodeURIComponent(AppRoutes.welcome.createSpace)}`,
      })
    })

    it('still waits for the store to hydrate before deciding', async () => {
      setupMocks({
        pathname: '/home',
        isAuthenticated: false,
        isStoreHydrated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })

    it('does not add next= when the unauthenticated user is on `/` (bare index is pointless as next)', async () => {
      setupMocks({
        pathname: '/',
        isAuthenticated: false,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })

    it('ignores a protocol-relative next= value (treated as no next, so stays on login page)', async () => {
      setupMocks({
        pathname: AppRoutes.welcome.spaces,
        query: { next: '//evil.com/owned' },
        isAuthenticated: true,
        spaces: defaultSpaces,
        isRequireLoginEnabled: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: true })
    })
  })
})
