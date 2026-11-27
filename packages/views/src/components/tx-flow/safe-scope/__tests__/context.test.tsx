import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import { SafeScopeContext, useSafeScope, useSafeScopeControls } from '../context'
import type { SafeScopeContextValue } from '../types'
import { hasActiveScope, registerActiveScope } from '../activeScope'

const makeValue = (): SafeScopeContextValue => {
  const chainId = '137'
  const safeAddress = faker.finance.ethereumAddress()
  return {
    scope: { chainId, safeAddress, scopeKey: `${chainId}:${safeAddress}`, safeLoaded: false, safeLoading: true },
    setScope: jest.fn(),
    clearScope: jest.fn(),
  }
}

describe('SafeScope context', () => {
  it('useSafeScope returns undefined outside a provider', () => {
    const { result } = renderHook(() => useSafeScope())
    expect(result.current).toBeUndefined()
  })

  it('useSafeScope returns the provided scope', () => {
    const value = makeValue()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
    )
    const { result } = renderHook(() => useSafeScope(), { wrapper })
    expect(result.current).toBe(value.scope)
  })

  it('useSafeScopeControls throws outside a provider', () => {
    expect(() => renderHook(() => useSafeScopeControls())).toThrow(
      'useSafeScopeControls must be used within a SafeScopeProvider',
    )
  })

  it('useSafeScopeControls exposes setScope and clearScope', () => {
    const value = makeValue()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
    )
    const { result } = renderHook(() => useSafeScopeControls(), { wrapper })
    expect(result.current.setScope).toBe(value.setScope)
    expect(result.current.clearScope).toBe(value.clearScope)
  })
})

describe('activeScope counter', () => {
  it('is inactive by default and toggles with register/unregister', () => {
    expect(hasActiveScope()).toBe(false)
    const unregisterA = registerActiveScope()
    const unregisterB = registerActiveScope()
    expect(hasActiveScope()).toBe(true)
    unregisterA()
    expect(hasActiveScope()).toBe(true)
    unregisterB()
    expect(hasActiveScope()).toBe(false)
  })
})
