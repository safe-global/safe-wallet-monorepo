import DeviceCrypto, { AccessLevel, BiometryType } from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import Logger from '@/src/utils/logger'
import { Platform } from 'react-native'

// Error codes for biometric enrollment issues
const BIOMETRIC_ERROR_CODES = {
  // iOS specific error codes
  IOS_NO_IDENTITIES_ENROLLED: '-7',
  IOS_ERROR_DOMAIN: 'com.apple.LocalAuthentication',

  // Android specific error codes
  ANDROID_BIOMETRICS_NOT_ENROLLED: '11',
  ANDROID_BIOMETRICS_ERROR_HW_UNAVAILABLE: '1',

  // Common error codes across platforms
  COULD_NOT_GET_BIOMETRY_TYPE: "Couldn't get biometry type",
}

// Type definition for biometric error
interface BiometricError {
  code?: string | number
  domain?: string
  message?: string
}

/**
 * Checks if biometric authentication is available and enabled on the device.
 * This includes verifying that biometrics are both supported by hardware AND enrolled by the user.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if biometrics are available, supported,
 * and enrolled, false otherwise.
 *
 * @throws Will log any errors encountered while checking biometrics, but will return false rather than throw.
 *
 * @remarks
 * This function is defined separately from the similar one in useBiometrics hook to:
 * 1. Avoid circular dependencies - this service is used by hooks but shouldn't depend on them
 * 2. Maintain separation of concerns - services should be independent of UI/React hooks
 * 3. Support non-React contexts - allows this function to be used in pure service layers
 * 4. Ensure lightweight implementation - provides just the core functionality without UI-related logic
 */
const ensureBiometricsAvailable = async (isEmulator = false): Promise<boolean> => {
  // For emulators, always return false to force using device unlock
  if (isEmulator) {
    Logger.info('Running on emulator, bypassing biometrics check')
    return false
  }

  try {
    // First check if hardware supports biometrics
    const biometryType = await DeviceCrypto.getBiometryType()

    // If hardware doesn't support biometrics, return false immediately
    if (biometryType === BiometryType.NONE) {
      return false
    }

    // Device reports biometrics support, now verify enrollment
    const biometricTestService = '__BIOMETRIC_SERVICE_TEST__'

    try {
      // Clean up any previous test entries
      await Keychain.resetGenericPassword({ service: biometricTestService })

      // Select appropriate access control based on platform
      const accessControl =
        Platform.OS === 'ios' ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET

      // Try to set a password with biometric protection
      await Keychain.setGenericPassword('biometric_test', 'enrollment_test', {
        service: biometricTestService,
        accessControl,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      })

      // Clean up test entry
      await Keychain.resetGenericPassword({ service: biometricTestService })

      // If we got here without errors, biometrics are fully operational
      return true
    } catch (error) {
      // Clean up regardless of error
      await Keychain.resetGenericPassword({ service: biometricTestService }).catch((cleanupError) => {
        Logger.warn('Failed to clean up biometric test:', cleanupError)
      })

      // Check for specific enrollment errors
      const biometricError = error as BiometricError
      const errorCode = biometricError.code?.toString()
      const errorDomain = biometricError.domain

      const isEnrollmentError =
        // iOS enrollment errors
        (Platform.OS === 'ios' &&
          (errorCode === BIOMETRIC_ERROR_CODES.IOS_NO_IDENTITIES_ENROLLED ||
            (errorDomain === BIOMETRIC_ERROR_CODES.IOS_ERROR_DOMAIN && errorCode === '-7'))) ||
        // Android enrollment errors
        (Platform.OS === 'android' && errorCode === BIOMETRIC_ERROR_CODES.ANDROID_BIOMETRICS_NOT_ENROLLED)

      if (isEnrollmentError) {
        Logger.info('Device supports biometrics but none are enrolled')
        return false
      }

      // User cancellation still indicates that biometrics are available
      if (
        errorCode === '-128' || // iOS cancel
        errorCode === '13'
      ) {
        // Android cancel
        Logger.info('User cancelled biometric test. Assuming biometrics are available.')
        return true
      }

      Logger.warn('Unknown error checking biometric enrollment:', error)
      return false
    }
  } catch (error) {
    Logger.error('Error checking biometrics support:', error)
    return false
  }
}

export class KeyStorageService implements IKeyStorageService {
  private readonly BIOMETRIC_PROMPTS = {
    SKIP: {
      biometryTitle: '',
      biometrySubTitle: '',
      biometryDescription: '',
    },
    STANDARD: {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Signing',
      biometryDescription: 'Authenticate yourself to sign the transactions',
    },
    SAVE: {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Saving key',
      biometryDescription: 'Please authenticate yourself',
    },
  }

  private async checkBiometricSupport(isEmulator = false): Promise<boolean> {
    return ensureBiometricsAvailable(isEmulator)
  }

  async storePrivateKey(
    userId: string,
    privateKey: string,
    options: PrivateKeyStorageOptions = { requireAuthentication: true },
  ): Promise<void> {
    try {
      const { requireAuthentication = true } = options
      const isEmulator = await DeviceInfo.isEmulator()
      Logger.info(`Running on emulator: ${isEmulator}`)
      await this.storeKey(userId, privateKey, requireAuthentication, isEmulator)
    } catch (err) {
      Logger.error('Error storing private key:', err)
      throw new Error('Failed to store private key')
    }
  }

  async getPrivateKey(
    userId: string,
    options: PrivateKeyStorageOptions = { requireAuthentication: true },
  ): Promise<string | undefined> {
    try {
      const isEmulator = await DeviceInfo.isEmulator()
      Logger.info(`Running on emulator: ${isEmulator}`)
      return await this.getKey(userId, options.requireAuthentication ?? true, isEmulator)
    } catch (err) {
      Logger.error('Error getting private key:', err)
      return undefined
    }
  }

  private getKeyName(userId: string): string {
    return `signer_address_${userId}`
  }

  /**
   * Determines the appropriate access level based on device capabilities and requirements
   *
   * If the device is an emulator, we use UNLOCKED_DEVICE
   * If the device is not an emulator and biometrics are not supported, we use UNLOCKED_DEVICE
   * Otherwise, we use AUTHENTICATION_REQUIRED
   */
  private async getAppropriateAccessLevel(requireAuth: boolean, isEmulator: boolean): Promise<AccessLevel> {
    // If no auth required or it's an emulator, always use the lowest level
    if (!requireAuth || isEmulator) {
      if (isEmulator) {
        Logger.info('Emulator detected, using UNLOCKED_DEVICE access level')
      }
      return AccessLevel.UNLOCKED_DEVICE
    }

    // Check if the device supports biometrics
    const biometricsSupported = await ensureBiometricsAvailable(isEmulator)

    // For real devices without biometrics, use device unlock
    if (requireAuth && !biometricsSupported) {
      Logger.info('Biometrics not supported or enrolled, falling back to UNLOCKED_DEVICE')
      return AccessLevel.UNLOCKED_DEVICE
    }

    // Only use biometric authentication on real devices with enrolled biometrics
    return AccessLevel.AUTHENTICATION_REQUIRED
  }

  private async getOrCreateKeyIOS(keyName: string, requireAuth: boolean, isEmulator: boolean): Promise<string> {
    try {
      const accessLevel = isEmulator
        ? AccessLevel.UNLOCKED_DEVICE
        : await this.getAppropriateAccessLevel(requireAuth, isEmulator)

      Logger.info(`Creating iOS key with access level: ${accessLevel}`)

      await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
        accessLevel,
        invalidateOnNewBiometry: !isEmulator && requireAuth,
      })

      return keyName
    } catch (error) {
      // Catch specific error for no enrolled biometrics and retry with device unlock
      const err = error as BiometricError
      Logger.warn('Error creating iOS key:', err.message || JSON.stringify(error))

      if (
        err.message?.includes('not pin/pass protected') ||
        err.message?.includes('no biometry has been enrolled') ||
        err.code === '-7'
      ) {
        Logger.info('Biometrics error occurred, retrying with UNLOCKED_DEVICE access level')

        // Create key with device unlock instead
        await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
          accessLevel: AccessLevel.UNLOCKED_DEVICE,
          invalidateOnNewBiometry: false,
        })

        return keyName
      }

      Logger.error('Error creating asymmetric encryption key:', error)
      throw new Error('Failed to create encryption key')
    }
  }

  /**
   * The android implementation of the device-crypto diverges from the iOS implementation
   * On Android, the encrypt function expects a symmetric key, while on iOS it expects an asymmetric key.
   */
  private async getOrCreateKeyAndroid(keyName: string, requireAuth: boolean, isEmulator: boolean): Promise<void> {
    try {
      // For emulators, always use UNLOCKED_DEVICE regardless of biometrics support
      const accessLevel = isEmulator
        ? AccessLevel.UNLOCKED_DEVICE
        : await this.getAppropriateAccessLevel(requireAuth, isEmulator)

      Logger.info(`Creating Android key with access level: ${accessLevel}`)

      await DeviceCrypto.getOrCreateSymmetricKey(keyName, {
        accessLevel,
        invalidateOnNewBiometry: false, // Don't invalidate on emulators
      })
    } catch (error) {
      // Catch specific error for no enrolled biometrics and retry with device unlock
      const err = error as BiometricError
      Logger.warn('Error creating Android key:', err.message || JSON.stringify(error))

      if (
        err.message?.includes('not pin/pass protected') ||
        err.message?.includes('no biometry has been enrolled') ||
        err.code === '11'
      ) {
        Logger.info('Biometrics error occurred, retrying with UNLOCKED_DEVICE access level')

        // Create key with device unlock instead
        await DeviceCrypto.getOrCreateSymmetricKey(keyName, {
          accessLevel: AccessLevel.UNLOCKED_DEVICE,
          invalidateOnNewBiometry: false,
        })

        return
      }

      Logger.error('Error creating symmetric encryption key:', error)
      throw new Error('Failed to create symmetric key')
    }
  }

  private async storeKey(userId: string, privateKey: string, requireAuth: boolean, isEmulator: boolean): Promise<void> {
    const keyName = this.getKeyName(userId)

    try {
      // Special case for Android emulators - bypass DeviceCrypto entirely
      if (isEmulator && Platform.OS === 'android') {
        Logger.info('Android emulator detected, using direct keychain storage without DeviceCrypto')

        // Simple encryption for emulator testing only
        // For emulators, we'll just prepend "emulator_" to the private key as a basic "encryption"
        // This is only for emulator testing
        const emulatorKey = `emulator_${privateKey}`

        // Store directly in keychain without DeviceCrypto
        await Keychain.setGenericPassword(
          'signer_address',
          JSON.stringify({
            encryptedPassword: emulatorKey,
            iv: 'emulator', // Dummy
          }),
          {
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            service: keyName,
          },
        )

        Logger.info('Successfully stored key with emulator bypass')
        return
      }

      // For iOS emulators, use the existing emulator path
      if (isEmulator && requireAuth) {
        Logger.info('Emulator detected, using device unlock only without biometrics')

        if (Platform.OS === 'android') {
          await DeviceCrypto.getOrCreateSymmetricKey(keyName, {
            accessLevel: AccessLevel.UNLOCKED_DEVICE,
            invalidateOnNewBiometry: false,
          })
        } else {
          await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
            accessLevel: AccessLevel.UNLOCKED_DEVICE,
            invalidateOnNewBiometry: false,
          })
        }

        // Encrypt with no biometrics
        const encryptedPrivateKey = await DeviceCrypto.encrypt(keyName, privateKey, this.BIOMETRIC_PROMPTS.SKIP)

        await Keychain.setGenericPassword(
          'signer_address',
          JSON.stringify({
            encryptedPassword: encryptedPrivateKey.encryptedText,
            iv: encryptedPrivateKey.iv,
          }),
          { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, service: keyName },
        )

        // Use device passcode for keychain access
        await Keychain.getGenericPassword({
          accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
          service: keyName,
        })

        return
      }

      // Normal flow for real devices
      if (Platform.OS === 'android') {
        await this.getOrCreateKeyAndroid(keyName, requireAuth, isEmulator)
      } else {
        await this.getOrCreateKeyIOS(keyName, requireAuth, isEmulator)
      }

      const encryptedPrivateKey = await DeviceCrypto.encrypt(keyName, privateKey, this.BIOMETRIC_PROMPTS.SAVE)

      await Keychain.setGenericPassword(
        'signer_address',
        JSON.stringify({
          encryptedPassword: encryptedPrivateKey.encryptedText,
          iv: encryptedPrivateKey.iv,
        }),
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, service: keyName },
      )

      // Enroll biometrics only if required and available
      if (requireAuth) {
        // Check if biometrics are supported on the device
        const biometricsSupported = await this.checkBiometricSupport(isEmulator)
        const accessControl = biometricsSupported
          ? Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE
          : Keychain.ACCESS_CONTROL.DEVICE_PASSCODE

        await Keychain.getGenericPassword({
          accessControl,
          service: keyName,
        })
      }
    } catch (error) {
      // Additional safety check for Android emulators
      if (Platform.OS === 'android' && isEmulator) {
        Logger.warn('Encountered error with Android emulator, falling back to simplest storage method:', error)

        try {
          const emulatorKey = `emulator_${privateKey}`

          // Store with minimal options
          await Keychain.setGenericPassword(
            'signer_address',
            JSON.stringify({
              encryptedPassword: emulatorKey,
              iv: 'emulator',
            }),
            { service: keyName },
          )

          Logger.info('Successfully stored key with ultimate emulator fallback')
          return
        } catch (fallbackError) {
          Logger.error('Even fallback storage failed on Android emulator:', fallbackError)
          throw new Error('Failed to store key on Android emulator')
        }
      }

      // Handle specific biometric enrollment errors during encryption for real devices
      const err = error as BiometricError
      if (
        err.message?.includes('not pin/pass protected') ||
        err.message?.includes('no biometry has been enrolled') ||
        err.code === '-7' ||
        err.code === '11'
      ) {
        Logger.info('Biometrics error during encryption, retrying with device passcode only')

        // Try again with device passcode only
        if (Platform.OS === 'android') {
          await DeviceCrypto.getOrCreateSymmetricKey(keyName, {
            accessLevel: AccessLevel.UNLOCKED_DEVICE,
            invalidateOnNewBiometry: false,
          })
        } else {
          await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
            accessLevel: AccessLevel.UNLOCKED_DEVICE,
            invalidateOnNewBiometry: false,
          })
        }

        // Encrypt with passcode only
        const encryptedPrivateKey = await DeviceCrypto.encrypt(keyName, privateKey, this.BIOMETRIC_PROMPTS.SAVE)

        await Keychain.setGenericPassword(
          'signer_address',
          JSON.stringify({
            encryptedPassword: encryptedPrivateKey.encryptedText,
            iv: encryptedPrivateKey.iv,
          }),
          { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, service: keyName },
        )

        // Use device passcode for keychain access
        await Keychain.getGenericPassword({
          accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
          service: keyName,
        })

        return
      }

      throw error
    }
  }

  private async getKey(userId: string, requireAuth: boolean, isEmulator: boolean): Promise<string> {
    const keyName = this.getKeyName(userId)

    try {
      // Special case for Android emulators
      if (isEmulator && Platform.OS === 'android') {
        Logger.info('Android emulator detected, using direct keychain retrieval without DeviceCrypto')

        const result = await Keychain.getGenericPassword({ service: keyName })
        if (!result) {
          throw 'user password not found'
        }

        const { encryptedPassword, iv } = JSON.parse(result.password)

        // Check if this is our emulator-specific format (has "emulator_" prefix)
        if (typeof encryptedPassword === 'string' && encryptedPassword.startsWith('emulator_') && iv === 'emulator') {
          // Extract the original private key by removing the "emulator_" prefix
          Logger.info('Successfully retrieved key with emulator bypass')
          return encryptedPassword.substring(9) // Remove "emulator_" prefix
        }

        // If not our special format, handle as normal (shouldn't happen, but just in case)
        Logger.warn('Found unexpected key format in Android emulator')
      }

      // Normal flow for iOS emulators and real devices
      const keychainOptions: Keychain.GetOptions = { service: keyName }
      if (requireAuth) {
        // Check if biometrics are supported on the device
        const biometricsSupported = await this.checkBiometricSupport(isEmulator)
        keychainOptions.accessControl = biometricsSupported
          ? Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE
          : Keychain.ACCESS_CONTROL.DEVICE_PASSCODE
      }

      const result = await Keychain.getGenericPassword(keychainOptions)
      if (!result) {
        throw 'user password not found'
      }

      const { encryptedPassword, iv } = JSON.parse(result.password)

      // Skip second biometric prompt if we already authenticated via Keychain
      const decryptParams = requireAuth ? this.BIOMETRIC_PROMPTS.SKIP : this.BIOMETRIC_PROMPTS.STANDARD

      try {
        return await DeviceCrypto.decrypt(keyName, encryptedPassword, iv, decryptParams)
      } catch (decryptError) {
        // Handle biometric enrollment issues during decryption
        const err = decryptError as BiometricError
        if (
          requireAuth &&
          (err.message?.includes('not pin/pass protected') ||
            err.message?.includes('no biometry has been enrolled') ||
            err.code === '-7' ||
            err.code === '11')
        ) {
          Logger.info('Biometrics error during decryption, retrying with fallback')

          // Try to get with device passcode instead
          const passcodeResult = await Keychain.getGenericPassword({
            accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
            service: keyName,
          })

          if (passcodeResult) {
            const { encryptedPassword: passcodeEncrypted, iv: passcodeIv } = JSON.parse(passcodeResult.password)
            return await DeviceCrypto.decrypt(keyName, passcodeEncrypted, passcodeIv, this.BIOMETRIC_PROMPTS.SKIP)
          }
        }

        throw decryptError
      }
    } catch (error) {
      Logger.error('Error getting key:', error)
      throw error
    }
  }
}
