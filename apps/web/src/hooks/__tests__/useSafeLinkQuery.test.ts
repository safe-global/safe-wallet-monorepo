import { renderHook } from '@/tests/test-utils'
import { createElement, type ReactNode } from 'react'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { chainBuilder } from '@/tests/builders/chains'
import { safeScopeContextFor } from '@/tests/mocks/safeScope'
import { useSafeLinkQuery } from '../useSafeLinkQuery'

const SAFE = 'matic:0x0000000000000000000000000000000000000001'
const SPACE_UUID = '11111111-1111-1111-1111-111111111111'

describe('useSafeLinkQuery', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('returns the Safe and the Workspace of the router query', () => {
    const { result } = renderHook(() => useSafeLinkQuery(), {
      routerProps: { query: { safe: SAFE, spaceId: SPACE_UUID } },
    })

    expect(result.current).toEqual({ safe: SAFE, spaceId: SPACE_UUID })
  })

  it('reads the Safe from the location while the router query is still empty', () => {
    window.history.replaceState(null, '', `/home?safe=${SAFE}`)

    const { result } = renderHook(() => useSafeLinkQuery(), { routerProps: { query: {} } })

    expect(result.current).toEqual({ safe: SAFE })
  })

  it('returns no Safe outside a Safe page', () => {
    const { result } = renderHook(() => useSafeLinkQuery(), { routerProps: { query: {} } })

    expect(result.current).toEqual({})
  })

  describe('inside a Space flow scoped to a Safe', () => {
    const scopedAddress = '0x0000000000000000000000000000000000000002'
    const withScope = (scope: SafeScopeContextValue) => ({
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(SafeScopeContext.Provider, { value: scope }, children),
    })

    it('links to the scoped Safe instead of the Safe of the URL', () => {
      const base = safeScopeContextFor({ chainId: '137', safeAddress: scopedAddress })
      const scope = { ...base, scope: { ...base.scope!, chain: chainBuilder().with({ shortName: 'pol' }).build() } }

      const { result } = renderHook(() => useSafeLinkQuery(), {
        ...withScope(scope),
        routerProps: { query: { safe: SAFE, spaceId: SPACE_UUID } },
      })

      expect(result.current).toEqual({ safe: `pol:${scopedAddress}`, spaceId: SPACE_UUID })
    })

    it('links to no Safe until the scoped chain resolves', () => {
      const scope = safeScopeContextFor({ chainId: '137', safeAddress: scopedAddress })

      const { result } = renderHook(() => useSafeLinkQuery(), {
        ...withScope(scope),
        routerProps: { query: { safe: SAFE, spaceId: SPACE_UUID } },
      })

      expect(result.current).toEqual({ spaceId: SPACE_UUID })
    })
  })
})
