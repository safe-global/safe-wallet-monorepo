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

export class MissingWrappingKeyError extends Error {
  constructor(cause: unknown) {
    super('Signer encryption key was not found on this device', { cause })
    this.name = 'MissingWrappingKeyError'
  }
}

const IOS_INVALIDATED_PATTERNS = [
  /AKSError\s*=\s*-?536362999\b/, // kAKSReturnPolicyInvalid
  /AKSError\s*=\s*-?536870203\b/, // kAKSReturnBadDeviceKey
  /\b0xe007c009\b/i,
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

export class KeyStorageError extends Error {
  constructor(cause: unknown) {
    const message = messageOf(cause)
    const authenticationCode = message.match(
      /(?:LAError(?:Domain)?|com\.apple\.LocalAuthentication)\s+Code\s*=?\s*(-\d+)\b/,
    )?.[1]
    const osStatus = message.match(/(?:Status:|OSStatus error|NSOSStatusErrorDomain\s+Code=)\s*(-\d+)\b/)?.[1]
    let description = 'Failed to store private key'
    if (authenticationCode === '-8') {
      description = 'Biometrics are locked. Unlock your device with its passcode and try again.'
    } else if (message.includes('No biometry has been enrolled') || ['-6', '-7'].includes(authenticationCode ?? '')) {
      description = 'Enable biometrics and allow this app to use them, then try again.'
    } else if (osStatus === '-25293') {
      description = 'Authentication failed. Check biometric access for this app and try again.'
    } else if (osStatus === '-128' || authenticationCode === '-2') {
      description = 'Authentication was cancelled. Please try again.'
    }
    super(description, { cause })
    this.name = 'KeyStorageError'
  }
}
