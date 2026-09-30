import { renderHook, act } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import { setSafeSDK, useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'

const singleton = { id: 'singleton' } as unknown as Safe
const scoped = { id: 'scoped' } as unknown as Safe

const withScope = (sdk: Safe | undefined) =>
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
            sdk,
          },
          setScope: jest.fn(),
          clearScope: jest.fn(),
        }}
      >
        {children}
      </SafeScopeContext.Provider>
    )
  }

describe('useSafeSDK', () => {
  beforeEach(() => setSafeSDK(singleton))
  afterEach(() => act(() => setSafeSDK(undefined)))

  it('returns the singleton without a scope (regression baseline)', () => {
    const { result } = renderHook(() => useSafeSDK())
    expect(result.current).toBe(singleton)
  })

  it('returns the scoped SDK under a scope', () => {
    const { result } = renderHook(() => useSafeSDK(), { wrapper: withScope(scoped) })
    expect(result.current).toBe(scoped)
  })

  it('returns undefined, not the singleton, while the scoped SDK is still initialising', () => {
    const { result } = renderHook(() => useSafeSDK(), { wrapper: withScope(undefined) })
    expect(result.current).toBeUndefined()
  })
})
