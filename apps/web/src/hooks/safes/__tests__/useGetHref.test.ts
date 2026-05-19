import { renderHook } from '@testing-library/react'
import type { NextRouter } from 'next/router'
import { useGetHref } from '../useGetHref'
import { AppRoutes } from '@/config/routes'
import * as useIsSpaceRouteModule from '@/hooks/useIsSpaceRoute'

jest.mock('@/hooks/useIsSpaceRoute')

const chain = { shortName: 'eth', chainId: '1' } as never

const buildRouter = (overrides: Partial<NextRouter>): NextRouter =>
  ({
    pathname: AppRoutes.home,
    query: {},
    ...overrides,
  }) as NextRouter

describe('useGetHref', () => {
  beforeEach(() => {
    jest.spyOn(useIsSpaceRouteModule, 'useIsSpaceRoute').mockReturnValue(false)
  })

  it('preserves the current query on non-space pages', () => {
    const router = buildRouter({
      pathname: AppRoutes.balances.index,
      query: { safe: 'eth:0xOld', someParam: 'keep' },
    })
    const { result } = renderHook(() => useGetHref(router))

    expect(result.current(chain, '0xNew')).toEqual({
      pathname: AppRoutes.balances.index,
      query: { someParam: 'keep', safe: 'eth:0xNew' },
    })
  })

  it('drops the existing query and carries spaceId when on a space page', () => {
    jest.spyOn(useIsSpaceRouteModule, 'useIsSpaceRoute').mockReturnValue(true)
    const router = buildRouter({
      pathname: AppRoutes.spaces.safeAccounts,
      query: { spaceId: '42', somethingElse: 'drop-me' },
    })
    const { result } = renderHook(() => useGetHref(router))

    expect(result.current(chain, '0xNew')).toEqual({
      pathname: AppRoutes.home,
      query: { spaceId: '42', safe: 'eth:0xNew' },
    })
  })

  it('keeps spaceId when navigating from a Safe page', () => {
    const router = buildRouter({
      pathname: AppRoutes.home,
      query: { safe: 'eth:0xOld', spaceId: '7' },
    })
    const { result } = renderHook(() => useGetHref(router))

    expect(result.current(chain, '0xNew')).toEqual({
      pathname: AppRoutes.home,
      query: { spaceId: '7', safe: 'eth:0xNew' },
    })
  })

  it('routes to /home from the welcome page', () => {
    const router = buildRouter({ pathname: AppRoutes.welcome.accounts, query: {} })
    const { result } = renderHook(() => useGetHref(router))

    expect(result.current(chain, '0xNew')).toEqual({
      pathname: AppRoutes.home,
      query: { safe: 'eth:0xNew' },
    })
  })

  it('routes to history from a single tx page', () => {
    const router = buildRouter({ pathname: AppRoutes.transactions.tx, query: { safe: 'eth:0xOld', id: 'abc' } })
    const { result } = renderHook(() => useGetHref(router))

    expect(result.current(chain, '0xNew')).toEqual({
      pathname: AppRoutes.transactions.history,
      query: { id: 'abc', safe: 'eth:0xNew' },
    })
  })
})
