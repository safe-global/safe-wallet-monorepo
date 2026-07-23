import type { Chain, Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { isSafeCreationSponsored, isDailyRelayQuota } from './chains'

const relayer = (overrides: Partial<Relayer> = {}): Relayer => ({
  type: 'RELAY_FEE',
  safeCreationSponsored: true,
  safeTransactionSponsored: true,
  enableTenderlySimulationBeforeRelay: true,
  ...overrides,
})

const chainWith = (relayerValue: Relayer | null): Pick<Chain, 'relayer'> => ({ relayer: relayerValue })

describe('relayer chain helpers', () => {
  describe('isSafeCreationSponsored', () => {
    it('requires a relay model and the creation flag to be set', () => {
      expect(isSafeCreationSponsored(chainWith(relayer({ safeCreationSponsored: true })))).toBe(true)
      expect(isSafeCreationSponsored(chainWith(relayer({ safeCreationSponsored: false })))).toBe(false)
    })

    it('is false when relaying is disabled even if the flag is set', () => {
      expect(isSafeCreationSponsored(chainWith(relayer({ type: null, safeCreationSponsored: true })))).toBe(false)
      expect(isSafeCreationSponsored(chainWith(null))).toBe(false)
      expect(isSafeCreationSponsored(undefined)).toBe(false)
    })
  })

  describe('isDailyRelayQuota', () => {
    it('is true for the quota-gated models (daily-limit, no-fee-campaign)', () => {
      expect(isDailyRelayQuota(chainWith(relayer({ type: 'DAILY_LIMIT' })))).toBe(true)
      expect(isDailyRelayQuota(chainWith(relayer({ type: 'NO_FEE_CAMPAIGN' })))).toBe(true)
    })

    it('is false for the unmetered models (relay-fee, gtf) and when relaying is disabled', () => {
      expect(isDailyRelayQuota(chainWith(relayer({ type: 'RELAY_FEE' })))).toBe(false)
      expect(isDailyRelayQuota(chainWith(relayer({ type: 'GTF' })))).toBe(false)
      expect(isDailyRelayQuota(chainWith(null))).toBe(false)
      expect(isDailyRelayQuota(undefined)).toBe(false)
    })
  })
})
