import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import Logger from '@/src/utils/logger'
import { Platform } from 'react-native'

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

  private async getOrCreateKeyIOS(keyName: string, requireAuth: boolean, isEmulator: boolean): Promise<string> {
    try {
      await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
        accessLevel: requireAuth ? (isEmulator ? 1 : 2) : 1,
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
      await DeviceCrypto.getOrCreateSymmetricKey(keyName, {
        accessLevel: requireAuth ? (isEmulator ? 1 : 2) : 1,
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

    // Enroll biometrics if required
    if (requireAuth) {
      await Keychain.getGenericPassword({
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
        service: keyName,
      })
    }
  }

  private async getKey(userId: string, requireAuth: boolean): Promise<string> {
    const keyName = this.getKeyName(userId)

    const keychainOptions: Keychain.GetOptions = { service: keyName }
    if (requireAuth) {
      keychainOptions.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE
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
