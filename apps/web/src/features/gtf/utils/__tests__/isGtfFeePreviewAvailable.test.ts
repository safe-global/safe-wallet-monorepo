import type { Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'

import { chainBuilder } from '@/tests/builders/chains'
import { isGtfFeePreviewAvailable } from '../isGtfFeePreviewAvailable'

const relayer = (type: Relayer['type']): Relayer => ({
  type,
  safeCreationSponsored: false,
  safeTransactionSponsored: false,
  enableTenderlySimulationBeforeRelay: false,
})

const buildChain = (features: FEATURES[], chainRelayer: Relayer | null) =>
  chainBuilder().with({ features, relayer: chainRelayer }).build()

describe('isGtfFeePreviewAvailable', () => {
  it('is available with the GTF flag and a RELAY_FEE or GTF relayer', () => {
    expect(isGtfFeePreviewAvailable(buildChain([FEATURES.GTF], relayer('RELAY_FEE')))).toBe(true)
    expect(isGtfFeePreviewAvailable(buildChain([FEATURES.GTF], relayer('GTF')))).toBe(true)
  })

  it('is unavailable when the GTF flag is on but the relayer is not set', () => {
    expect(isGtfFeePreviewAvailable(buildChain([FEATURES.GTF], null))).toBe(false)
  })

  it('is unavailable with a relayer type that cannot quote fees', () => {
    expect(isGtfFeePreviewAvailable(buildChain([FEATURES.GTF], relayer('DAILY_LIMIT')))).toBe(false)
    expect(isGtfFeePreviewAvailable(buildChain([FEATURES.GTF], relayer('NO_FEE_CAMPAIGN')))).toBe(false)
    expect(isGtfFeePreviewAvailable(buildChain([FEATURES.GTF], relayer(null)))).toBe(false)
  })

  it('is unavailable without the GTF flag, even with a RELAY_FEE relayer', () => {
    expect(isGtfFeePreviewAvailable(buildChain([], relayer('RELAY_FEE')))).toBe(false)
  })

  it('is unavailable without a chain', () => {
    expect(isGtfFeePreviewAvailable(undefined)).toBe(false)
  })
})
