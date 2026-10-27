import type { Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'

import { chainBuilder } from '@/tests/builders/chains'
import { isPayFromSafeAvailable } from '../isPayFromSafeAvailable'

const relayer = (type: Relayer['type']): Relayer => ({
  type,
  safeCreationSponsored: false,
  safeTransactionSponsored: false,
  enableTenderlySimulationBeforeRelay: false,
  gasPaymentOptions: ['SUBSCRIPTION'],
})

const buildChain = (features: FEATURES[], chainRelayer: Relayer | null) =>
  chainBuilder().with({ features, relayer: chainRelayer }).build()

describe('isPayFromSafeAvailable', () => {
  it('is available with the Pay from Safe flag and a RELAY_FEE or GTF relayer', () => {
    expect(isPayFromSafeAvailable(buildChain([FEATURES.GTF], relayer('RELAY_FEE')))).toBe(true)
    expect(isPayFromSafeAvailable(buildChain([FEATURES.GTF], relayer('GTF')))).toBe(true)
  })

  it('is unavailable when the Pay from Safe flag is on but the relayer is not set', () => {
    expect(isPayFromSafeAvailable(buildChain([FEATURES.GTF], null))).toBe(false)
  })

  it('is unavailable with a relayer type that cannot quote fees', () => {
    expect(isPayFromSafeAvailable(buildChain([FEATURES.GTF], relayer('DAILY_LIMIT')))).toBe(false)
    expect(isPayFromSafeAvailable(buildChain([FEATURES.GTF], relayer('NO_FEE_CAMPAIGN')))).toBe(false)
    expect(isPayFromSafeAvailable(buildChain([FEATURES.GTF], relayer(null)))).toBe(false)
  })

  it('is unavailable without the Pay from Safe flag, even with a RELAY_FEE relayer', () => {
    expect(isPayFromSafeAvailable(buildChain([], relayer('RELAY_FEE')))).toBe(false)
  })

  it('is unavailable without a chain', () => {
    expect(isPayFromSafeAvailable(undefined)).toBe(false)
  })
})
