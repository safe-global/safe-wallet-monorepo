import { renderHook, act } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import type { JsonRpcProvider } from 'ethers'
import { setWeb3ReadOnly, useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'

const singleton = { id: 'singleton' } as unknown as JsonRpcProvider
const scoped = { id: 'scoped' } as unknown as JsonRpcProvider

const withScope = (web3ReadOnly: JsonRpcProvider | undefined) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeScopeContext.Provider
        value={{
          scope: {
            chainId: '137',
            safeAddress: '0x0000000000000000000000000000000000000456',
            scopeKey: '137:0x0000000000000000000000000000000000000456',
            safeLoaded: true,
            safeLoading: false,
            web3ReadOnly,
          },
          setScope: jest.fn(),
          clearScope: jest.fn(),
        }}
      >
        {children}
      </SafeScopeContext.Provider>
    )
  }

describe('useWeb3ReadOnly', () => {
  beforeEach(() => setWeb3ReadOnly(singleton))
  afterEach(() => act(() => setWeb3ReadOnly(undefined)))

  it('returns the singleton without a scope (regression baseline)', () => {
    const { result } = renderHook(() => useWeb3ReadOnly())
    expect(result.current).toBe(singleton)
  })

  it('returns the scoped provider under a scope', () => {
    const { result } = renderHook(() => useWeb3ReadOnly(), { wrapper: withScope(scoped) })
    expect(result.current).toBe(scoped)
  })

  it('returns undefined, not the singleton, while the scoped provider is still initialising', () => {
    const { result } = renderHook(() => useWeb3ReadOnly(), { wrapper: withScope(undefined) })
    expect(result.current).toBeUndefined()
  })
})
