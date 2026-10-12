import type { ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { useIsHypernativeEligible } from '@/features/hypernative'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { RootState } from '@/store'
import useSafeInfo from '../useSafeInfo'

const leftoverSafe = extendedSafeInfoBuilder().build()
const leftoverReduxSafe = {
  safeInfo: { data: leftoverSafe, loaded: true, loading: false },
} as unknown as Partial<RootState>

const wrapper = ({ children }: { children: ReactNode }) => <SafeScopeProvider>{children}</SafeScopeProvider>

describe('useSafeInfo inside a Space flow that has not picked a Safe', () => {
  it('reports no Safe instead of the Safe left in Redux', () => {
    const { result } = renderHook(() => useSafeInfo(), { wrapper, initialReduxState: leftoverReduxSafe })

    expect(result.current.safeAddress).toBe('')
    expect(result.current.safeLoaded).toBe(false)
    expect(result.current.safeLoading).toBe(false)
  })

  it('does not leave the Hypernative eligibility check loading forever', () => {
    const { result } = renderHook(() => useIsHypernativeEligible(), { wrapper, initialReduxState: leftoverReduxSafe })

    expect(result.current.loading).toBe(false)
  })
})
