import * as nextRouter from 'next/router'
import type { NextRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { renderHook } from '@/tests/test-utils'
import { useSafeAppRedirects } from '@/hooks/safe-apps/useSafeAppRedirects'

const mockRouter = (props: Partial<NextRouter>): NextRouter =>
  ({
    isReady: true,
    query: { safe: 'eth:0x123' },
    push: jest.fn(),
    replace: jest.fn(),
    ...props,
  }) as unknown as NextRouter

const baseParams = {
  safeAppData: { chainIds: ['1'] },
  chainId: '1',
  isSafeAppsEnabled: true,
  appUrl: 'https://swap.cow.fi',
  remoteSafeAppsLoading: false,
  goToList: jest.fn(),
}

describe('useSafeAppRedirects', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('renders the app when there is nothing to redirect', () => {
    const router = mockRouter({})
    jest.spyOn(nextRouter, 'useRouter').mockReturnValue(router)

    const { result } = renderHook(() => useSafeAppRedirects(baseParams))

    expect(result.current).toBe(true)
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    expect(baseParams.goToList).not.toHaveBeenCalled()
  })

  it('replaces the route with the native page and does not render the app', () => {
    const router = mockRouter({})
    jest.spyOn(nextRouter, 'useRouter').mockReturnValue(router)

    const { result } = renderHook(() => useSafeAppRedirects({ ...baseParams, nativeRoute: AppRoutes.swap }))

    expect(result.current).toBe(false)
    expect(router.replace).toHaveBeenCalledWith({ pathname: AppRoutes.swap, query: { safe: 'eth:0x123' } })
  })

  it('does not redirect to the native page until the router is ready', () => {
    const router = mockRouter({ isReady: false })
    jest.spyOn(nextRouter, 'useRouter').mockReturnValue(router)

    const { result } = renderHook(() => useSafeAppRedirects({ ...baseParams, nativeRoute: AppRoutes.swap }))

    expect(result.current).toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('prefers the share page when no Safe is selected', () => {
    const router = mockRouter({ query: {} })
    jest.spyOn(nextRouter, 'useRouter').mockReturnValue(router)

    const { result } = renderHook(() => useSafeAppRedirects({ ...baseParams, nativeRoute: AppRoutes.swap }))

    expect(result.current).toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith({
      pathname: AppRoutes.share.safeApp,
      query: { appUrl: baseParams.appUrl },
    })
  })

  it('sends the user back to the list when the app does not support the chain', () => {
    const router = mockRouter({})
    jest.spyOn(nextRouter, 'useRouter').mockReturnValue(router)
    const goToList = jest.fn()

    renderHook(() => useSafeAppRedirects({ ...baseParams, goToList, safeAppData: { chainIds: ['100'] } }))

    expect(goToList).toHaveBeenCalledTimes(1)
  })

  it('does not render when Safe Apps are disabled on the chain', () => {
    jest.spyOn(nextRouter, 'useRouter').mockReturnValue(mockRouter({}))

    const { result } = renderHook(() => useSafeAppRedirects({ ...baseParams, isSafeAppsEnabled: false }))

    expect(result.current).toBe(false)
  })
})
