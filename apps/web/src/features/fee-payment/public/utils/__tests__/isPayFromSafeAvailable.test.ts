import type { Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { chainBuilder } from '@/tests/builders/chains'
import { isPayFromSafeAvailable } from '../isPayFromSafeAvailable'

const relayer = (gasPaymentOptions: Relayer['gasPaymentOptions'], type: Relayer['type'] = 'DAILY_LIMIT'): Relayer => ({
  type,
  safeCreationSponsored: false,
  safeTransactionSponsored: false,
  enableTenderlySimulationBeforeRelay: false,
  gasPaymentOptions,
})

const buildChain = (chainRelayer: Relayer | null, features: string[] = []) =>
  chainBuilder()
    .with({ features: features as never, relayer: chainRelayer })
    .build()

describe('isPayFromSafeAvailable', () => {
  it('is available when the relayer lists PAY_FROM_SAFE, with no feature flag', () => {
    expect(isPayFromSafeAvailable(buildChain(relayer(['PAY_FROM_SAFE'])))).toBe(true)
    expect(isPayFromSafeAvailable(buildChain(relayer(['FREE_DAILY_LIMIT', 'SUBSCRIPTION', 'PAY_FROM_SAFE'])))).toBe(
      true,
    )
  })

  it('ignores the relayer type', () => {
    expect(isPayFromSafeAvailable(buildChain(relayer(['PAY_FROM_SAFE'], 'RELAY_FEE')))).toBe(true)
    expect(isPayFromSafeAvailable(buildChain(relayer(['PAY_FROM_SAFE'], 'NO_FEE_CAMPAIGN')))).toBe(true)
  })

  it('is unavailable when the relayer does not list PAY_FROM_SAFE, whatever the flags', () => {
    expect(isPayFromSafeAvailable(buildChain(relayer(['SUBSCRIPTION']), ['GTF', 'PAY_FROM_SAFE']))).toBe(false)
    expect(isPayFromSafeAvailable(buildChain(relayer([]), ['GTF']))).toBe(false)
  })

  it('is unavailable without a relayer', () => {
    expect(isPayFromSafeAvailable(buildChain(null, ['GTF']))).toBe(false)
  })

  it('is unavailable without a chain', () => {
    expect(isPayFromSafeAvailable(undefined)).toBe(false)
  })
})
