import { type ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { useIsGtfSlotVisible } from '../useIsGtfSlotVisible'
import * as useChainsModule from '@/hooks/useChains'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { GasPayer } from '@/utils/gasPayment'

const withTxFlow = (isRejection: boolean, gasPaymentOption?: GasPayer) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TxFlowContext.Provider value={{ isRejection, gasPaymentOption } as never}>{children}</TxFlowContext.Provider>
  )
  return Wrapper
}

describe('useIsGtfSlotVisible', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns true on a non-rejection flow when GTF is enabled', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(true)
  })

  it('returns true on a rejection flow when GTF is enabled (PLA-1384)', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(true) })

    expect(result.current).toBe(true)
  })

  it('returns false on a non-rejection flow when GTF is disabled', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(false)
  })

  it('returns false on a rejection flow when GTF is disabled', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(true) })

    expect(result.current).toBe(false)
  })

  it.each<[GasPayer | undefined, boolean]>([
    [undefined, true],
    ['WALLET', true],
    ['FREE_DAILY_LIMIT', false],
    ['SUBSCRIPTION', false],
  ])('with GTF enabled and gas payment option %s returns %s', (gasPaymentOption, expected) => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(false, gasPaymentOption) })

    expect(result.current).toBe(expected)
  })

  it('returns false with GTF disabled even when the wallet pays', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useIsGtfSlotVisible(), { wrapper: withTxFlow(false, 'WALLET') })

    expect(result.current).toBe(false)
  })
})
