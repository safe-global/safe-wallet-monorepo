import { type ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { useIsFeeCardSlotVisible } from '../useIsFeeCardSlotVisible'
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

const payFromSafeChain = chainBuilder()
  .with({ relayer: relayer(['PAY_FROM_SAFE']) })
  .build()
const noPayFromSafeChain = chainBuilder()
  .with({ relayer: relayer(['SUBSCRIPTION']) })
  .build()
const noRelayerChain = chainBuilder().with({ relayer: null }).build()

const withTxFlow = (isRejection: boolean, gasPaymentOption?: GasPayer) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TxFlowContext.Provider value={{ isRejection, gasPaymentOption } as never}>{children}</TxFlowContext.Provider>
  )
  return Wrapper
}

describe('useIsFeeCardSlotVisible', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  // The card shows on every chain: what the relayer offers only decides which options are unlocked.
  it.each([
    ['offers Pay from Safe', payFromSafeChain],
    ['does not offer Pay from Safe', noPayFromSafeChain],
    ['has no relayer', noRelayerChain],
  ])('returns true on a chain whose relayer %s', (_, chain) => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(chain)

    const { result } = renderHook(() => useIsFeeCardSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(true)
  })

  it('returns true on a rejection flow (PLA-1384)', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(noPayFromSafeChain)

    const { result } = renderHook(() => useIsFeeCardSlotVisible(), { wrapper: withTxFlow(true) })

    expect(result.current).toBe(true)
  })

  it('returns false while the chain is unknown', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(undefined)

    const { result } = renderHook(() => useIsFeeCardSlotVisible(), { wrapper: withTxFlow(false) })

    expect(result.current).toBe(false)
  })

  it.each<[GasPayer | undefined, boolean]>([
    [undefined, true],
    // Any mounted execute form owns the fee card, whoever pays.
    ['WALLET', false],
    ['FREE_DAILY_LIMIT', false],
    ['SUBSCRIPTION', false],
    ['PAY_FROM_SAFE', false],
  ])('with gas payment option %s returns %s', (gasPaymentOption, expected) => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(payFromSafeChain)

    const { result } = renderHook(() => useIsFeeCardSlotVisible(), { wrapper: withTxFlow(false, gasPaymentOption) })

    expect(result.current).toBe(expected)
  })
})
