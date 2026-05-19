import { renderHook } from '@/tests/test-utils'
import { useSpaceIdSync } from '../index'
import * as store from '@/store'
import * as useChainsModule from '@/hooks/useChains'
import * as useChainIdModule from '@/hooks/useChainId'
import * as useSafeAddressFromUrlModule from '@/hooks/useSafeAddressFromUrl'
import * as spacesApi from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

type AuthState = {
  isAuthenticated?: boolean
  isOidcLoginPending?: boolean
  isStoreHydrated?: boolean
  lastUsedSpace?: string | null
}

const mockAuth = ({
  isAuthenticated = false,
  isOidcLoginPending = false,
  isStoreHydrated = true,
  lastUsedSpace = null,
}: AuthState = {}) => {
  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isAuthenticated ? Date.now() + 60_000 : null,
        lastUsedSpace,
        isStoreHydrated,
        isOidcLoginPending,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })
}

// Helper takes semantic-level inputs (e.g. requireLogin === true → login required).
// Chain flags are inverted kill switches, so we mock the chain hook accordingly:
// semantic ON → chain flag false; semantic OFF → chain flag true; undefined passes through.
const mockFlags = ({
  requireLogin = true,
  classicEnabled = true,
}: { requireLogin?: boolean | undefined; classicEnabled?: boolean | undefined } = {}) => {
  const toChainFlag = (semantic: boolean | undefined): boolean | undefined =>
    semantic === undefined ? undefined : !semantic
  jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockImplementation((feature) => {
    if (feature === 'DISABLE_SPACES_LOGIN') return toChainFlag(requireLogin)
    if (feature === 'DISABLE_CLASSIC_UI') return toChainFlag(classicEnabled)
    return undefined
  })
}

const mockSpaces = (spaceIds: string[] | null, isError = false) => {
  const data: GetSpaceResponse[] | undefined =
    spaceIds === null
      ? undefined
      : spaceIds.map((id) => ({ id: Number(id), name: `s${id}`, members: [], safeCount: 0 }))
  jest.spyOn(spacesApi, 'useSpacesGetV1Query').mockReturnValue({
    data,
    isError,
    isLoading: data === undefined && !isError,
    isFetching: false,
    refetch: jest.fn(),
  } as never)
}

const mockSpaceSafes = (safes: Record<string, string[]> | undefined) => {
  jest.spyOn(spacesApi, 'useSpaceSafesGetV1Query').mockReturnValue({
    currentData: safes ? { safes } : undefined,
    isError: false,
    isLoading: !safes,
    isFetching: false,
    refetch: jest.fn(),
  } as never)
}

const mockCurrentSafe = (chainId: string | undefined, address: string) => {
  jest.spyOn(useChainIdModule, 'useUrlChainId').mockReturnValue(chainId)
  jest.spyOn(useSafeAddressFromUrlModule, 'useSafeAddressFromUrl').mockReturnValue(address)
}

describe('useSpaceIdSync', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('injects ?spaceId for signed-in user with no spaceId in URL', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { spaceId: '7' } }, undefined, { shallow: true })
  })

  it('overwrites invalid ?spaceId on non-/spaces route', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?spaceId=99',
        query: { spaceId: '99' },
        replace,
      },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { spaceId: '7' } }, undefined, { shallow: true })
  })

  it('leaves invalid ?spaceId alone on /spaces/* routes', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/spaces/settings',
        asPath: '/spaces/settings?spaceId=99',
        query: { spaceId: '99' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('forces signed-in user with zero spaces to /spaces', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces([])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/spaces' })
  })

  it('bounces signed-out user with ?spaceId to sign-in with redirect', () => {
    mockAuth({ isAuthenticated: false })
    mockFlags()
    mockSpaces(null)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?spaceId=42&safe=eth:0xabc',
        query: { spaceId: '42', safe: 'eth:0xabc' },
        replace,
      },
    })

    expect(replace).toHaveBeenCalledWith({
      pathname: '/welcome/spaces',
      query: { redirect: '/home?spaceId=42&safe=eth:0xabc' },
    })
  })

  it('bounces signed-out user even without ?spaceId when CLASSIC is disabled', () => {
    mockAuth({ isAuthenticated: false })
    mockFlags({ classicEnabled: false })
    mockSpaces(null)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({
      pathname: '/welcome/spaces',
      query: { redirect: '/home' },
    })
  })

  it('is inert when DISABLE_SPACES_LOGIN is set (legacy mode)', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags({ requireLogin: false, classicEnabled: true })
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('skips excluded routes', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/welcome/spaces',
        asPath: '/welcome/spaces',
        query: {},
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does not act before router.isReady', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: false, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does not act before redux-persist hydration completes', () => {
    // Pre-hydration: sessionExpiresAt isn't restored yet so isAuthenticated reads false,
    // but a freshly opened deep link with ?spaceId could otherwise bounce the user.
    mockAuth({ isAuthenticated: false, isStoreHydrated: false })
    mockFlags()
    mockSpaces(null)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?spaceId=42',
        query: { spaceId: '42' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does not redirect when OIDC sign-in is pending', () => {
    mockAuth({ isAuthenticated: false, isOidcLoginPending: true })
    mockFlags()
    mockSpaces(null)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?spaceId=42',
        query: { spaceId: '42' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does not kick the user when spaces query errored', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(null, true)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('injects the last used space (not the first owned) when ?spaceId is missing', () => {
    mockAuth({ isAuthenticated: true, lastUsedSpace: '9' })
    mockFlags()
    mockSpaces(['7', '9'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { spaceId: '9' } }, undefined, { shallow: true })
  })

  it('falls back to the first owned space when lastUsedSpace is no longer a member', () => {
    mockAuth({ isAuthenticated: true, lastUsedSpace: '999' })
    mockFlags()
    mockSpaces(['7', '9'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { spaceId: '7' } }, undefined, { shallow: true })
  })

  it('does not inject lastUsedSpace when the URL safe is not part of it', () => {
    mockAuth({ isAuthenticated: true, lastUsedSpace: '9' })
    mockFlags()
    mockSpaces(['7', '9'])
    mockCurrentSafe('1', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    // Last used space '9' only contains a different safe — not the one in the URL.
    mockSpaceSafes({ '1': ['0xFFffFFffFFffFFffFFffFFffFFffFFffFFffFFff'] })
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?safe=eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        query: { safe: 'eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('injects lastUsedSpace when the URL safe IS part of it', () => {
    mockAuth({ isAuthenticated: true, lastUsedSpace: '9' })
    mockFlags()
    mockSpaces(['7', '9'])
    mockCurrentSafe('1', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    mockSpaceSafes({ '1': ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] })
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?safe=eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        query: { safe: 'eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        replace,
      },
    })

    expect(replace).toHaveBeenCalledWith(
      {
        pathname: '/home',
        query: { safe: 'eth:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', spaceId: '9' },
      },
      undefined,
      { shallow: true },
    )
  })
})
