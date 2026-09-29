import { renderHook } from '@testing-library/react'
import type { NextRouter } from 'next/router'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { AppRoutes } from '@/config/routes'
import { useGetHref } from '../useGetHref'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const ADDRESS = '0x0000000000000000000000000000000000000001'
const chain = { shortName: 'eth' } as Chain

let mockIsSpaceRoute = false
jest.mock('@/hooks/useIsSpaceRoute', () => ({ useIsSpaceRoute: () => mockIsSpaceRoute }))

let mockSpaceIdQuery: { spaceId?: string } = {}
jest.mock('@/hooks/useUrlSpaceId', () => ({ useSpaceIdQuery: () => mockSpaceIdQuery }))

const routerAt = (pathname: string, query: NextRouter['query']) => ({ pathname, query }) as NextRouter

describe('useGetHref', () => {
  beforeEach(() => {
    mockIsSpaceRoute = false
    mockSpaceIdQuery = {}
  })

  it('opens a Safe from a Workspace page in that Workspace', () => {
    mockIsSpaceRoute = true
    mockSpaceIdQuery = { spaceId: SPACE_ID }
    const router = routerAt(AppRoutes.spaces.safeAccounts, { spaceId: SPACE_ID, sort: 'name' })

    const { result } = renderHook(() => useGetHref(router))

    const href = result.current(chain, ADDRESS)
    expect(href).toEqual({ pathname: AppRoutes.home, query: { safe: `eth:${ADDRESS}`, spaceId: SPACE_ID } })
    // Every Safe link puts `safe` first, so the URL reads the same wherever the link comes from
    expect(Object.keys(href.query)).toEqual(['safe', 'spaceId'])
  })

  it('keeps the query of a Safe page, and replaces only the Safe', () => {
    const router = routerAt(AppRoutes.balances.index, { safe: 'eth:0x2', spaceId: SPACE_ID })

    const { result } = renderHook(() => useGetHref(router))

    expect(result.current(chain, ADDRESS)).toEqual({
      pathname: AppRoutes.balances.index,
      query: { spaceId: SPACE_ID, safe: `eth:${ADDRESS}` },
    })
  })

  it('opens a Safe from the accounts page on its dashboard, outside any Workspace', () => {
    const router = routerAt(AppRoutes.welcome.accounts, {})

    const { result } = renderHook(() => useGetHref(router))

    expect(result.current(chain, ADDRESS)).toEqual({ pathname: AppRoutes.home, query: { safe: `eth:${ADDRESS}` } })
  })
})
