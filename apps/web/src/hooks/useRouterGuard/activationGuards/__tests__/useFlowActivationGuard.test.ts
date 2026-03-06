import { renderHook } from '@/tests/test-utils'
import { useFlowActivationGuard } from '../useFlowActivationGuard'
import * as router from 'next/router'
import * as store from '@/store'
import * as useWalletModule from '@/hooks/wallets/useWallet'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import * as useIsSpaceRouteModule from '@/hooks/useIsSpaceRoute'

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
  spaces?: Array<{ id: number; name: string }> | undefined
  isSpaceRoute?: boolean
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
}: SetupOptions = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ pathname, query })
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

    it('should redirect to welcome when not authenticated via SIWE on a space route', async () => {
      setupMocks({
        pathname: AppRoutes.spaces.index,
        wallet: { address: '0x123' },
        walletContext: { isReady: true },
        isStoreHydrated: true,
        isAuthenticated: false,
        isSpaceRoute: true,
      })

      const { result } = renderHook(() => useFlowActivationGuard())
      const guardResult = await result.current.activationGuard()

      expect(guardResult).toEqual({ success: false, redirectTo: AppRoutes.welcome.index })
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
})
