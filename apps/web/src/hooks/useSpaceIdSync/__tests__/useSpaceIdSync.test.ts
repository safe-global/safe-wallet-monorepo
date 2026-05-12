import { renderHook } from '@/tests/test-utils'
import { useSpaceIdSync } from '../index'
import * as store from '@/store'
import * as useChainsModule from '@/hooks/useChains'
import * as spacesApi from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

type AuthState = { isAuthenticated?: boolean; isOidcLoginPending?: boolean }

const mockAuth = ({ isAuthenticated = false, isOidcLoginPending = false }: AuthState = {}) => {
  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isAuthenticated ? Date.now() + 60_000 : null,
        isStoreHydrated: true,
        isOidcLoginPending,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })
}

const mockFlags = ({
  requireLogin = true,
  classicEnabled = true,
}: { requireLogin?: boolean | undefined; classicEnabled?: boolean | undefined } = {}) => {
  jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockImplementation((feature) => {
    if (feature === 'REQUIRE_SPACES_LOGIN') return requireLogin
    if (feature === 'CLASSIC_UI_ENABLED') return classicEnabled
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

  it('is inert when REQUIRE_SPACES_LOGIN is off (legacy mode)', () => {
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
})
