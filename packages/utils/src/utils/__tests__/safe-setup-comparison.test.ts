import { areOwnersMatching, haveSameSetup, type SafeSetupData } from '../safe-setup-comparison'

describe('safe-setup-comparison', () => {
  describe('areOwnersMatching', () => {
    it('should return true for identical owner arrays', () => {
      const owners1 = ['0x1234', '0x5678', '0x9abc']
      const owners2 = ['0x1234', '0x5678', '0x9abc']

      expect(areOwnersMatching(owners1, owners2)).toBe(true)
    })

    it('should return true for owners in different order', () => {
      const owners1 = ['0x1234', '0x5678', '0x9abc']
      const owners2 = ['0x9abc', '0x1234', '0x5678']

      expect(areOwnersMatching(owners1, owners2)).toBe(true)
    })

    it('should return false for different owner arrays', () => {
      const owners1 = ['0x1234', '0x5678', '0x9abc']
      const owners2 = ['0x1234', '0x5678', '0xdiff']

      expect(areOwnersMatching(owners1, owners2)).toBe(false)
    })

    it('should return false for arrays of different lengths', () => {
      const owners1 = ['0x1234', '0x5678']
      const owners2 = ['0x1234', '0x5678', '0x9abc']

      expect(areOwnersMatching(owners1, owners2)).toBe(false)
    })

    it('should return true for empty arrays', () => {
      expect(areOwnersMatching([], [])).toBe(true)
    })

    it('should handle case-insensitive address comparison', () => {
      const owners1 = ['0x1234ABCD', '0x5678EFGH']
      const owners2 = ['0x1234abcd', '0x5678efgh']

      expect(areOwnersMatching(owners1, owners2)).toBe(true)
    })
  })

  describe('haveSameSetup', () => {
    const createSafeSetup = (owners: string[], threshold: number): SafeSetupData => ({
      owners: owners.map((owner) => ({ value: owner })),
      threshold,
    })

    const createSafeSetupStrings = (owners: string[], threshold: number): SafeSetupData => ({
      owners,
      threshold,
    })

    it('should return true for identical safe setups with object owners', () => {
      const safe1 = createSafeSetup(['0x1234', '0x5678'], 2)
      const safe2 = createSafeSetup(['0x1234', '0x5678'], 2)

      expect(haveSameSetup(safe1, safe2)).toBe(true)
    })

    it('should return true for identical safe setups with string owners', () => {
      const safe1 = createSafeSetupStrings(['0x1234', '0x5678'], 2)
      const safe2 = createSafeSetupStrings(['0x1234', '0x5678'], 2)

      expect(haveSameSetup(safe1, safe2)).toBe(true)
    })

    it('should return true for safe setups with owners in different order', () => {
      const safe1 = createSafeSetup(['0x1234', '0x5678'], 2)
      const safe2 = createSafeSetup(['0x5678', '0x1234'], 2)

      expect(haveSameSetup(safe1, safe2)).toBe(true)
    })

    it('should return false for different thresholds', () => {
      const safe1 = createSafeSetup(['0x1234', '0x5678'], 1)
      const safe2 = createSafeSetup(['0x1234', '0x5678'], 2)

      expect(haveSameSetup(safe1, safe2)).toBe(false)
    })

    it('should return false for different owners', () => {
      const safe1 = createSafeSetup(['0x1234', '0x5678'], 2)
      const safe2 = createSafeSetup(['0x1234', '0x9abc'], 2)

      expect(haveSameSetup(safe1, safe2)).toBe(false)
    })

    it('should return false when one safe is null', () => {
      const safe1 = createSafeSetup(['0x1234', '0x5678'], 2)

      expect(haveSameSetup(safe1, null)).toBe(false)
      expect(haveSameSetup(null, safe1)).toBe(false)
    })

    it('should return false when one safe is undefined', () => {
      const safe1 = createSafeSetup(['0x1234', '0x5678'], 2)

      expect(haveSameSetup(safe1, undefined)).toBe(false)
      expect(haveSameSetup(undefined, safe1)).toBe(false)
    })

    it('should return false when both safes are null', () => {
      expect(haveSameSetup(null, null)).toBe(false)
    })

    it('should handle mixed owner formats (objects vs strings)', () => {
      const safe1 = createSafeSetup(['0x1234', '0x5678'], 2)
      const safe2 = createSafeSetupStrings(['0x1234', '0x5678'], 2)

      expect(haveSameSetup(safe1, safe2)).toBe(true)
    })

    it('should handle case-insensitive addresses', () => {
      const safe1 = createSafeSetup(['0x1234ABCD', '0x5678EFGH'], 2)
      const safe2 = createSafeSetup(['0x1234abcd', '0x5678efgh'], 2)

      expect(haveSameSetup(safe1, safe2)).toBe(true)
    })
  })
})
