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

export class MissingStoredKeyError extends Error {
  constructor() {
    super('No encrypted private key was found on this device')
    this.name = 'MissingStoredKeyError'
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

export type KeyStorageOperation = 'store' | 'create' | 'encrypt' | 'verify' | 'persist' | 'recover' | 'remove'

export class KeyStorageError extends Error {
  readonly diagnostics: {
    operation: KeyStorageOperation
    code?: string
    domain?: string
    authenticationCode?: string
    osStatus?: string
    aksCode?: string
    message: string
  }

  constructor(cause: unknown, action: 'store' | 'remove' = 'store', operation: KeyStorageOperation = action) {
    const message = messageOf(cause)
    const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : undefined
    const authenticationCode =
      (typeof code === 'string' ? code.match(/^E_AUTHENTICATION_(-\d+)$/)?.[1] : undefined) ??
      message.match(/(?:LAError(?:Domain)?|com\.apple\.LocalAuthentication)\s+Code\s*=?\s*(-\d+)\b/)?.[1]
    const osStatus = message.match(/(?:Status:|OSStatus error|NSOSStatusErrorDomain\s+Code=)\s*(-\d+)\b/)?.[1]
    let description = action === 'remove' ? 'Failed to remove private key' : 'Failed to store private key'
    if (authenticationCode === '-8') {
      description = 'Biometrics are locked. Unlock your device with its passcode and try again.'
    } else if (message.includes('No biometry has been enrolled') || ['-6', '-7'].includes(authenticationCode ?? '')) {
      description = 'Enable biometrics and allow this app to use them, then try again.'
    } else if (osStatus === '-25293') {
      description = 'Authentication failed. Check biometric access for this app and try again.'
    } else if (osStatus === '-128' || authenticationCode === '-2') {
      description = 'Authentication was cancelled. Please try again.'
    } else if (authenticationCode === '-3') {
      description = 'Authentication was cancelled. Please try again.'
    } else if (authenticationCode === '-4' || authenticationCode === '-9') {
      description = 'Authentication was interrupted. Please try again.'
    } else if (authenticationCode === '-1') {
      description = 'Authentication failed. Please try again.'
    } else if (authenticationCode === '-5') {
      description = 'Set up a device passcode and try again.'
    }
    super(description, { cause })
    this.name = 'KeyStorageError'
    const safeMessages = [
      'Private key verification failed',
      'Failed to persist encrypted private key',
      'Failed to remove invalidated encryption key',
      'Failed to remove encryption key',
      'Failed to remove encrypted private key',
    ]
    const nativeCodes = [
      'E1711',
      'E1712',
      'E1715: Unexpected OSStatus',
      'E1760 - Decryption error.',
      'E1760 - Encryption error.',
      'E_PUBLIC_KEY_PRIVATE_MISSING',
      'E_PUBLIC_KEY_DERIVATION',
      'E_PUBLIC_KEY_EXPORT',
      'E_PRIVATE_KEY_MISSING',
      'E_DELETE_PRIVATE_KEY',
    ]
    this.diagnostics = {
      operation,
      code:
        typeof code === 'string' && (nativeCodes.includes(code) || /^E_AUTHENTICATION_-\d{1,3}$/.test(code))
          ? code
          : undefined,
      domain: authenticationCode ? 'com.apple.LocalAuthentication' : osStatus ? 'NSOSStatusErrorDomain' : undefined,
      authenticationCode,
      osStatus,
      aksCode: message.match(/AKSError\s*=\s*(-?\d+)\b/)?.[1],
      message: safeMessages.includes(message) ? message : description,
    }
  }
}
