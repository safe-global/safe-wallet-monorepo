import { Platform } from 'react-native'

export const BIOMETRY_ROTATION_DESCRIPTION =
  "Your device's biometric settings appear to have changed since this signer was imported. " +
  'Re-import the signer from Settings → Signers to restore signing'

export class BiometryInvalidationError extends Error {
  constructor(cause: unknown) {
    super('Signer encryption key is no longer usable', { cause })
    this.name = 'BiometryInvalidationError'
  }
}

const IOS_INVALIDATED_PATTERNS = [
  /AKSError\s*=\s*-?536362999\b/, // kAKSReturnPolicyInvalid
  /AKSError\s*=\s*-?536870203\b/, // kAKSReturnBadDeviceKey
  /\b0xe007c009\b/i,
  /OSStatus error -25293\b/, // errSecAuthFailed
  /LAError(?:Domain)?\s+Code\s*=?\s*-7\b/, // biometryNotEnrolled
]

const ANDROID_INVALIDATED_PATTERNS = [
  /^9- /, // ERROR_LOCKOUT_PERMANENT
  /^11- /, // ERROR_NO_BIOMETRICS
  /^14- /, // ERROR_NO_DEVICE_CREDENTIAL
  /Key permanently invalidated/i,
]

const messageOf = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message
  }
  return String(err)
}

export const isBiometryInvalidationError = (err: unknown): boolean => {
  const msg = messageOf(err)
  const patterns = Platform.OS === 'ios' ? IOS_INVALIDATED_PATTERNS : ANDROID_INVALIDATED_PATTERNS
  return patterns.some((p) => p.test(msg))
}
