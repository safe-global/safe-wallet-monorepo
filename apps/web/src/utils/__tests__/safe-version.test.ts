import { SafeFeature } from '@safe-global/protocol-kit'
import { hasSafeFeature } from '../safe-versions'

describe('safe-version', () => {
  describe('hasSafeFeature', () => {
    it('should return an false if the version is null', () => {
      expect(hasSafeFeature(SafeFeature.SAFE_FALLBACK_HANDLER, null)).toEqual(false)
    })

    it('should return false if the feature is not a valid feature', () => {
      // @ts-ignore
      expect(hasSafeFeature('FAKE_FEATURE', '1.0.0')).toEqual(false)
    })

    it('should return an false if the version does not support the feature', () => {
      // 1.0.0
      expect(hasSafeFeature(SafeFeature.ETH_SIGN, '1.0.0')).toEqual(false)
      expect(hasSafeFeature(SafeFeature.SAFE_FALLBACK_HANDLER, '1.0.0')).toEqual(false)
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GAS_OPTIONAL, '1.0.0')).toEqual(false)
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GUARDS, '1.0.0')).toEqual(false)

      // 1.1.0
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GAS_OPTIONAL, '1.1.0')).toEqual(false)
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GUARDS, '1.1.0')).toEqual(false)

      // 1.1.1
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GAS_OPTIONAL, '1.1.1')).toEqual(false)
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GUARDS, '1.1.1')).toEqual(false)
    })

    it('should return true if the version supports the feature', () => {
      // 1.1.0
      expect(hasSafeFeature(SafeFeature.ETH_SIGN, '1.1.0')).toEqual(true)

      // 1.1.1
      expect(hasSafeFeature(SafeFeature.ETH_SIGN, '1.1.1')).toEqual(true)
      expect(hasSafeFeature(SafeFeature.SAFE_FALLBACK_HANDLER, '1.1.1')).toEqual(true)

      // 1.3.0
      expect(hasSafeFeature(SafeFeature.ETH_SIGN, '1.3.0')).toEqual(true)
      expect(hasSafeFeature(SafeFeature.SAFE_FALLBACK_HANDLER, '1.3.1')).toEqual(true)
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GAS_OPTIONAL, '1.3.1')).toEqual(true)
      expect(hasSafeFeature(SafeFeature.SAFE_TX_GUARDS, '1.3.0')).toEqual(true)
    })
  })
})
