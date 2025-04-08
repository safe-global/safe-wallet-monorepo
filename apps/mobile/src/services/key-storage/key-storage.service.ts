import DeviceCrypto, { AccessLevel, BiometryType } from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import Logger from '@/src/utils/logger'
import { Platform } from 'react-native'

// Import this from a shared utility or use a local implementation
const ensureBiometricsAvailable = async (): Promise<boolean> => {
  try {
    const biometryType = await DeviceCrypto.getBiometryType()
    return biometryType !== BiometryType.NONE
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

  // Add the missing checkBiometricSupport method
  private async checkBiometricSupport(): Promise<boolean> {
    return ensureBiometricsAvailable()
  }

  async storePrivateKey(
    userId: string,
    privateKey: string,
    options: PrivateKeyStorageOptions = { requireAuthentication: true },
  ): Promise<void> {
    try {
      const { requireAuthentication = true } = options
      const isEmulator = await DeviceInfo.isEmulator()
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
      return await this.getKey(userId, options.requireAuthentication ?? true)
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
    if (!requireAuth) {
      return AccessLevel.ALWAYS
    }

    // Check if the device supports biometrics
    const biometricsSupported = await ensureBiometricsAvailable()

    if (isEmulator) {
      return AccessLevel.UNLOCKED_DEVICE
    }

    // If authentication is required but biometrics aren't available, fall back to device unlock
    if (requireAuth && !biometricsSupported) {
      Logger.info('Biometrics not supported, falling back to UNLOCKED_DEVICE')
      return AccessLevel.UNLOCKED_DEVICE
    }

    // Otherwise use biometric authentication
    return AccessLevel.AUTHENTICATION_REQUIRED
  }

  private async getOrCreateKeyIOS(keyName: string, requireAuth: boolean, isEmulator: boolean): Promise<string> {
    try {
      const accessLevel = await this.getAppropriateAccessLevel(requireAuth, isEmulator)

      await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
        accessLevel,
        invalidateOnNewBiometry: requireAuth,
      })

      return keyName
    } catch (error) {
      Logger.error('Error creating key:', error)
      throw new Error('Failed to create encryption key')
    }
  }

  /**
   * The android implementation of the device-crypto diverges from the iOS implementation
   * On Android, the encrypt function expects a symmetric key, while on iOS it expects an asymmetric key.
   */
  private async getOrCreateKeyAndroid(keyName: string, requireAuth: boolean, isEmulator: boolean): Promise<void> {
    try {
      const accessLevel = await this.getAppropriateAccessLevel(requireAuth, isEmulator)

      await DeviceCrypto.getOrCreateSymmetricKey(keyName, {
        accessLevel,
        invalidateOnNewBiometry: requireAuth,
      })
    } catch (error) {
      Logger.error('Error creating symmetric encryption key:', error)
      throw new Error('Failed to create symmetric key')
    }
  }

  private async storeKey(userId: string, privateKey: string, requireAuth: boolean, isEmulator: boolean): Promise<void> {
    const keyName = this.getKeyName(userId)

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
      const biometricsSupported = await this.checkBiometricSupport()
      const accessControl = biometricsSupported
        ? Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE
        : Keychain.ACCESS_CONTROL.DEVICE_PASSCODE

      await Keychain.getGenericPassword({
        accessControl,
        service: keyName,
      })
    }
  }

  private async getKey(userId: string, requireAuth: boolean): Promise<string> {
    const keyName = this.getKeyName(userId)

    const keychainOptions: Keychain.GetOptions = { service: keyName }
    if (requireAuth) {
      // Check if biometrics are supported on the device
      const biometricsSupported = await this.checkBiometricSupport()
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
    return DeviceCrypto.decrypt(keyName, encryptedPassword, iv, decryptParams)
  }
}
