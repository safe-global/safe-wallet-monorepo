import { type ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { useIsGtfSlotVisible } from '../useIsGtfSlotVisible'
import * as useChainsModule from '@/hooks/useChains'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'

const withTxFlow = (isRejection: boolean) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TxFlowContext.Provider value={{ isRejection } as never}>{children}</TxFlowContext.Provider>
  )
  return Wrapper
}

describe('useIsGtfSlotVisible', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns true on a non-rejection flow when GTF is enabled', () => {
    jest.spyOn(useChainsModule, 'useIsUnlimitedRelay').mockReturnValue(true)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(true)
  })

  it('returns true on a rejection flow when GTF is enabled (PLA-1384)', () => {
    jest.spyOn(useChainsModule, 'useIsUnlimitedRelay').mockReturnValue(true)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(true) })

    expect(result.current).toBe(true)
  })

  it('returns false on a non-rejection flow when GTF is disabled', () => {
    jest.spyOn(useChainsModule, 'useIsUnlimitedRelay').mockReturnValue(false)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(false)
  })

  it('returns false on a rejection flow when GTF is disabled', () => {
    jest.spyOn(useChainsModule, 'useIsUnlimitedRelay').mockReturnValue(false)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(true) })

    expect(result.current).toBe(false)
  })
})
