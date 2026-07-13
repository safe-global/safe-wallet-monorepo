import { Platform } from 'react-native'
import { BiometryInvalidationError, isBiometryInvalidationError } from './errors'

describe('key-storage/errors', () => {
  const originalPlatform = Platform.OS

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true })
  })

  const setPlatform = (os: 'ios' | 'android') => {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true })
  }

  describe('BiometryInvalidationError', () => {
    it('preserves the cause and sets a stable name', () => {
      const cause = new Error('underlying')
      const err = new BiometryInvalidationError(cause)

      expect(err.name).toBe('BiometryInvalidationError')
      expect(err.message).toBe('Signer encryption key is no longer usable')
      expect(err.cause).toBe(cause)
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(BiometryInvalidationError)
    })
  })

  describe('isBiometryInvalidationError — iOS', () => {
    beforeEach(() => setPlatform('ios'))

    it('matches the canonical kAKSReturnPolicyInvalid AKSError', () => {
      const msg =
        'E1760 - Decryption error.: Error Domain=CryptoTokenKit Code=-3 ' +
        '"<sepk:p256(d) kid=107556c293aef9fb>: unable to compute shared secret" ' +
        'UserInfo={NSDebugDescription=<sepk:p256(d) kid=107556c293aef9fb>: unable to compute shared secret, AKSError=-536362999}'
      expect(isBiometryInvalidationError(new Error(msg))).toBe(true)
    })

    it('matches kAKSReturnBadDeviceKey', () => {
      expect(isBiometryInvalidationError(new Error('AKSError=-536870203'))).toBe(true)
    })

    it('matches the hex form 0xe007c009', () => {
      expect(isBiometryInvalidationError(new Error('failed (0xe007c009)'))).toBe(true)
    })

    it('matches errSecAuthFailed (OSStatus -25293)', () => {
      expect(isBiometryInvalidationError(new Error('OSStatus error -25293'))).toBe(true)
    })

    it('does NOT match errSecItemNotFound (-25300, no-item-in-keychain — handled separately)', () => {
      expect(isBiometryInvalidationError(new Error('OSStatus error -25300'))).toBe(false)
    })

    it('matches LAErrorBiometryNotEnrolled (-7)', () => {
      expect(isBiometryInvalidationError(new Error('LAErrorDomain Code=-7'))).toBe(true)
    })

    it('does NOT match LAErrorBiometryLockout (-8, transient)', () => {
      expect(isBiometryInvalidationError(new Error('LAErrorDomain Code=-8 biometry lockout'))).toBe(false)
    })

    it('does NOT match LAErrorUserCancel (-2, transient)', () => {
      expect(isBiometryInvalidationError(new Error('LAErrorDomain Code=-2 user canceled'))).toBe(false)
    })

    it('does NOT match a generic CryptoTokenKit Code=-3 without AKSError', () => {
      expect(isBiometryInvalidationError(new Error('Error Domain=CryptoTokenKit Code=-3 "something else"'))).toBe(false)
    })

    it('handles non-Error throwables (strings)', () => {
      expect(isBiometryInvalidationError('AKSError=-536362999')).toBe(true)
      expect(isBiometryInvalidationError('something benign')).toBe(false)
    })
  })

  describe('isBiometryInvalidationError — Android', () => {
    beforeEach(() => setPlatform('android'))

    it('matches ERROR_LOCKOUT_PERMANENT (9-)', () => {
      expect(isBiometryInvalidationError(new Error('9- biometric lockout permanent'))).toBe(true)
    })

    it('matches ERROR_NO_BIOMETRICS (11-)', () => {
      expect(isBiometryInvalidationError(new Error('11- no biometrics enrolled'))).toBe(true)
    })

    it('matches ERROR_NO_DEVICE_CREDENTIAL (14-)', () => {
      expect(isBiometryInvalidationError(new Error('14- no device credential'))).toBe(true)
    })

    it('matches the KeyPermanentlyInvalidatedException string', () => {
      expect(isBiometryInvalidationError(new Error('Key permanently invalidated'))).toBe(true)
    })

    it('does NOT match ERROR_CANCELED (5-, user-driven)', () => {
      expect(isBiometryInvalidationError(new Error('5- Fingerprint operation Cancelled'))).toBe(false)
    })

    it('does NOT match ERROR_LOCKOUT (7-, transient)', () => {
      expect(isBiometryInvalidationError(new Error('7- biometric lockout'))).toBe(false)
    })

    it('does NOT match ERROR_USER_CANCELED (10-, user-driven)', () => {
      expect(isBiometryInvalidationError(new Error('10- user cancelled'))).toBe(false)
    })

    it('does NOT match ERROR_NEGATIVE_BUTTON (13-, user-driven)', () => {
      expect(isBiometryInvalidationError(new Error('13- negative button'))).toBe(false)
    })
  })
})
