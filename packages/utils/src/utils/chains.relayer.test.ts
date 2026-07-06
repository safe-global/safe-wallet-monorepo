import type { Chain, Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import {
  isRelayingEnabled,
  isUnlimitedRelay,
  isNoFeeCampaign,
  isSafeCreationSponsored,
  isSafeTransactionSponsored,
  isTenderlySimulationBeforeRelayEnabled,
} from './chains'

const relayer = (overrides: Partial<Relayer> = {}): Relayer => ({
  type: 'RELAY_FEE',
  safeCreationSponsored: true,
  safeTransactionSponsored: true,
  enableTenderlySimulationBeforeRelay: true,
  ...overrides,
})

const chainWith = (relayerValue: Relayer | null): Pick<Chain, 'relayer'> => ({ relayer: relayerValue })

describe('relayer chain helpers', () => {
  describe('isRelayingEnabled', () => {
    it('is false when the chain is undefined', () => {
      expect(isRelayingEnabled(undefined)).toBe(false)
    })

    it('is false when relayer is null', () => {
      expect(isRelayingEnabled(chainWith(null))).toBe(false)
    })

    it('is false when relayer.type is null', () => {
      expect(isRelayingEnabled(chainWith(relayer({ type: null })))).toBe(false)
    })

    it.each(['GTF', 'RELAY_FEE', 'DAILY_LIMIT', 'NO_FEE_CAMPAIGN'] as const)('is true for type %s', (type) => {
      expect(isRelayingEnabled(chainWith(relayer({ type })))).toBe(true)
    })
  })

  describe('isUnlimitedRelay', () => {
    it('is true only for the GTF type', () => {
      expect(isUnlimitedRelay(chainWith(relayer({ type: 'GTF' })))).toBe(true)
      expect(isUnlimitedRelay(chainWith(relayer({ type: 'RELAY_FEE' })))).toBe(false)
      expect(isUnlimitedRelay(chainWith(null))).toBe(false)
      expect(isUnlimitedRelay(undefined)).toBe(false)
    })
  })

  describe('isNoFeeCampaign', () => {
    it('is true only for the NO_FEE_CAMPAIGN type', () => {
      expect(isNoFeeCampaign(chainWith(relayer({ type: 'NO_FEE_CAMPAIGN' })))).toBe(true)
      expect(isNoFeeCampaign(chainWith(relayer({ type: 'GTF' })))).toBe(false)
      expect(isNoFeeCampaign(chainWith(null))).toBe(false)
    })
  })

  describe('isSafeCreationSponsored', () => {
    it('requires relaying to be enabled and the creation flag to be set', () => {
      expect(isSafeCreationSponsored(chainWith(relayer({ safeCreationSponsored: true })))).toBe(true)
      expect(isSafeCreationSponsored(chainWith(relayer({ safeCreationSponsored: false })))).toBe(false)
    })

    it('is false when relaying is disabled even if the flag is set', () => {
      expect(isSafeCreationSponsored(chainWith(relayer({ type: null, safeCreationSponsored: true })))).toBe(false)
    })
  })

  describe('isSafeTransactionSponsored', () => {
    it('requires relaying to be enabled and the transaction flag to be set', () => {
      expect(isSafeTransactionSponsored(chainWith(relayer({ safeTransactionSponsored: true })))).toBe(true)
      expect(isSafeTransactionSponsored(chainWith(relayer({ safeTransactionSponsored: false })))).toBe(false)
    })

    it('is false when relaying is disabled even if the flag is set', () => {
      expect(isSafeTransactionSponsored(chainWith(relayer({ type: null, safeTransactionSponsored: true })))).toBe(false)
    })
  })

  describe('isTenderlySimulationBeforeRelayEnabled', () => {
    it('requires relaying to be enabled and the simulation flag to be set', () => {
      expect(
        isTenderlySimulationBeforeRelayEnabled(chainWith(relayer({ enableTenderlySimulationBeforeRelay: true }))),
      ).toBe(true)
      expect(
        isTenderlySimulationBeforeRelayEnabled(chainWith(relayer({ enableTenderlySimulationBeforeRelay: false }))),
      ).toBe(false)
      expect(
        isTenderlySimulationBeforeRelayEnabled(
          chainWith(relayer({ type: null, enableTenderlySimulationBeforeRelay: true })),
        ),
      ).toBe(false)
    })
  })
})
