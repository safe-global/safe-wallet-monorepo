import { isDelayModifier, hasRecoverySetup } from '../recoveryDetection'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'

const ACTIVE_MODULE = '0xabcdef1234567890abcdef1234567890abcdef12'

describe('recoveryDetection', () => {
  describe('isDelayModifier', () => {
    it('matches canonical delay modifier names case- and whitespace-insensitively', () => {
      expect(isDelayModifier('1', ACTIVE_MODULE, 'Delay Modifier')).toBe(true)
      expect(isDelayModifier('1', ACTIVE_MODULE, 'delay')).toBe(true)
      expect(isDelayModifier('1', ACTIVE_MODULE, '  Zodiac Delay Modifier ')).toBe(true)
    })

    it('does not match unrelated module names', () => {
      expect(isDelayModifier('1', ACTIVE_MODULE, 'SomeOtherModule')).toBe(false)
    })

    it('returns false for an unknown address with no name', () => {
      expect(isDelayModifier('1', ACTIVE_MODULE)).toBe(false)
    })
  })

  describe('hasRecoverySetup', () => {
    it('returns false when modules is null', () => {
      expect(hasRecoverySetup('1', null)).toBe(false)
    })

    it('returns false when there are no modules', () => {
      expect(hasRecoverySetup('1', [])).toBe(false)
    })

    it('ignores zero-address modules even if named like a delay modifier', () => {
      expect(hasRecoverySetup('1', [{ value: ZERO_ADDRESS, name: 'Delay Modifier' }])).toBe(false)
    })

    it('returns true when an active delay modifier is present', () => {
      expect(hasRecoverySetup('1', [{ value: ACTIVE_MODULE, name: 'Delay Modifier' }])).toBe(true)
    })

    it('returns false when modules exist but none are recognized as recovery', () => {
      expect(hasRecoverySetup('1', [{ value: ACTIVE_MODULE, name: 'SomeOtherModule' }])).toBe(false)
    })
  })
})
