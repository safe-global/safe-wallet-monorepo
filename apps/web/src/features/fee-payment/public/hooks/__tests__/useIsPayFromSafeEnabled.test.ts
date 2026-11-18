import { renderHook } from '@/tests/test-utils'
import * as useChainsModule from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { useIsPayFromSafeEnabled } from '../useIsPayFromSafeEnabled'

const relayer = (gasPaymentOptions: string[]) =>
  ({
    type: 'RELAY_FEE',
    safeCreationSponsored: false,
    safeTransactionSponsored: false,
    enableTenderlySimulationBeforeRelay: false,
    gasPaymentOptions,
  }) as never

describe('useIsPayFromSafeEnabled', () => {
  afterEach(() => jest.restoreAllMocks())

  it('is true when the chain relayer offers PAY_FROM_SAFE', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(
      chainBuilder()
        .with({ relayer: relayer(['SUBSCRIPTION', 'PAY_FROM_SAFE']) })
        .build(),
    )

    expect(renderHook(() => useIsPayFromSafeEnabled()).result.current).toBe(true)
  })

  it('is false when the relayer does not offer it', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(
      chainBuilder()
        .with({ relayer: relayer(['SUBSCRIPTION']) })
        .build(),
    )

    expect(renderHook(() => useIsPayFromSafeEnabled()).result.current).toBe(false)
  })

  it('is false on a chain without relayer', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(chainBuilder().with({ relayer: null }).build())

    expect(renderHook(() => useIsPayFromSafeEnabled()).result.current).toBe(false)
  })

  it('is undefined while the chain is unknown', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(undefined)

    expect(renderHook(() => useIsPayFromSafeEnabled()).result.current).toBeUndefined()
  })
})
