import { type ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { useIsPayFromSafeSlotVisible } from '../useIsPayFromSafeSlotVisible'
import * as useChainsModule from '@/hooks/useChains'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { GasPayer } from '@/utils/gasPayment'
import { chainBuilder } from '@/tests/builders/chains'

const relayer = (gasPaymentOptions: string[]) =>
  ({
    type: 'RELAY_FEE',
    safeCreationSponsored: false,
    safeTransactionSponsored: false,
    enableTenderlySimulationBeforeRelay: false,
    gasPaymentOptions,
  }) as never

// Pay from Safe follows the chain's relayer: no feature flag involved
const payFromSafeChain = chainBuilder()
  .with({ relayer: relayer(['PAY_FROM_SAFE']) })
  .build()
const noPayFromSafeChain = chainBuilder()
  .with({ relayer: relayer(['SUBSCRIPTION']) })
  .build()

const withTxFlow = (isRejection: boolean, gasPaymentOption?: GasPayer) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TxFlowContext.Provider value={{ isRejection, gasPaymentOption } as never}>{children}</TxFlowContext.Provider>
  )
  return Wrapper
}

describe('useIsPayFromSafeSlotVisible', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns true on a non-rejection flow when the relayer offers Pay from Safe', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(payFromSafeChain)

    const { result } = renderHook(() => useIsPayFromSafeSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(true)
  })

  it('returns true on a rejection flow when the relayer offers Pay from Safe (PLA-1384)', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(payFromSafeChain)

    const { result } = renderHook(() => useIsPayFromSafeSlotVisible(), { wrapper: withTxFlow(true) })

    expect(result.current).toBe(true)
  })

  it('returns false on a non-rejection flow when the relayer does not offer Pay from Safe', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(noPayFromSafeChain)

    const { result } = renderHook(() => useIsPayFromSafeSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(false)
  })

  it('returns false on a rejection flow when the relayer does not offer Pay from Safe', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(noPayFromSafeChain)

    const { result } = renderHook(() => useIsPayFromSafeSlotVisible(), { wrapper: withTxFlow(true) })

    expect(result.current).toBe(false)
  })

  it.each<[GasPayer | undefined, boolean]>([
    [undefined, true],
    // Any mounted execute form owns the fee card, whoever pays.
    ['WALLET', false],
    ['FREE_DAILY_LIMIT', false],
    ['SUBSCRIPTION', false],
  ])('with Pay from Safe offered and gas payment option %s returns %s', (gasPaymentOption, expected) => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(payFromSafeChain)

    const { result } = renderHook(() => useIsPayFromSafeSlotVisible(), { wrapper: withTxFlow(false, gasPaymentOption) })

    expect(result.current).toBe(expected)
  })

  it('returns false with Pay from Safe disabled even when the wallet pays', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(noPayFromSafeChain)

    const { result } = renderHook(() => useIsPayFromSafeSlotVisible(), { wrapper: withTxFlow(false, 'WALLET') })

    expect(result.current).toBe(false)
  })
})
