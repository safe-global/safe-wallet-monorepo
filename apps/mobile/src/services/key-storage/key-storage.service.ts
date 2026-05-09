import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import Logger from '@/src/utils/logger'
import { Platform } from 'react-native'
import { asError } from '@safe-global/utils/services/exceptions/utils'

export class KeyStorageService implements IKeyStorageService {
  private storeTries = 0
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
    this.storeTries = 0
    try {
      const { requireAuthentication = true } = options
      // On the Android emulator there is no Strongbox, but the library can work without it
      // On iOS simulator we can't use the secureEnclave as there is none
      const isEmulator = Platform.OS === 'android' ? false : await DeviceInfo.isEmulator()
      await this.storeKey(userId, privateKey, requireAuthentication, isEmulator)
    } catch (err) {
      Logger.error('Error storing private key:', asError(err).message)
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
      Logger.error('Error getting private key:', asError(err).message)
      return undefined
    }
  }

  async removePrivateKey(
    userId: string,
    options: PrivateKeyStorageOptions = { requireAuthentication: true },
  ): Promise<void> {
    try {
      const { requireAuthentication = true } = options
      await this.removeKey(userId, requireAuthentication)
    } catch (err) {
      Logger.error('Error removing private key:', asError(err).message)
      throw new Error('Failed to remove private key')
    }
  }

  private getKeyNameDeviceCrypto(userId: string): string {
    return `signer_address_${userId}`
  }

  private getKeyService(userId: string): string {
    return `${this.getKeyNameDeviceCrypto(userId)}_encrypted_storage`
  }

  private async getOrCreateKeyIOS(keyName: string, requireAuth: boolean, isEmulator: boolean): Promise<string> {
    try {
      await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
        accessLevel: requireAuth ? (isEmulator ? 1 : 2) : 1,
        invalidateOnNewBiometry: requireAuth,
      })

      return keyName
    } catch (error) {
      Logger.error('Error creating key:', asError(error).message)
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
      Logger.error('Error creating symmetric encryption key:', asError(error).message)
      throw new Error('Failed to create symmetric key')
    }
  }

  private async storeKey(userId: string, privateKey: string, requireAuth: boolean, isEmulator: boolean): Promise<void> {
    const keyName = this.getKeyNameDeviceCrypto(userId)

    if (Platform.OS === 'android') {
      await this.getOrCreateKeyAndroid(keyName, requireAuth, isEmulator)
    } else {
      await this.getOrCreateKeyIOS(keyName, requireAuth, isEmulator)
    }

    try {
      const encryptedPrivateKey = await DeviceCrypto.encrypt(keyName, privateKey, this.BIOMETRIC_PROMPTS.SAVE)

      await Keychain.setGenericPassword(
        'signer_address',
        JSON.stringify({
          encryptedPassword: encryptedPrivateKey.encryptedText,
          iv: encryptedPrivateKey.iv,
        }),
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, service: this.getKeyService(userId) },
      )

      // Reset retry counter on successful storage
      this.storeTries = 0
    } catch (error) {
      if (this.isKeyPermanentlyInvalidatedError(error)) {
        try {
          await this.handleKeyInvalidation(userId, requireAuth)
          this.storeTries++
          return await this.storeKey(userId, privateKey, requireAuth, isEmulator)
        } catch (_error) {
          throw new Error('Failed to store private key')
        }
      }
      throw new Error('Failed to store private key')
    }
  }

  private async getKey(userId: string, requireAuth: boolean): Promise<string> {
    const keyName = this.getKeyNameDeviceCrypto(userId)

    const keychainOptions: Keychain.GetOptions = { service: this.getKeyService(userId) }
    if (requireAuth) {
      keychainOptions.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE
    }

    const result = await Keychain.getGenericPassword(keychainOptions)
    if (!result) {
      throw 'user password not found'
    }

    const { encryptedPassword, iv } = JSON.parse(result.password)

    const decryptedPrivateKey = await DeviceCrypto.decrypt(
      keyName,
      encryptedPassword,
      iv,
      this.BIOMETRIC_PROMPTS.STANDARD,
    )
    return decryptedPrivateKey
  }

  private isKeyPermanentlyInvalidatedError(error: unknown): boolean {
    const errorMessage = asError(error).message
    return errorMessage.includes('Key permanently invalidated')
  }

  private async handleKeyInvalidation(userId: string, requireAuth: boolean): Promise<void> {
    Logger.warn('Key has been permanently invalidated, removing key')
    await this.removeKey(userId, requireAuth)
  }

  private async removeKey(userId: string, requireAuth: boolean): Promise<void> {
    const keyName = this.getKeyNameDeviceCrypto(userId)
    const service = this.getKeyService(userId)

    // First, try to delete from keychain (requires authentication if enabled)
    const keychainOptions: Keychain.GetOptions = { service }
    if (requireAuth) {
      keychainOptions.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE
    }

    try {
      // Check if the key exists in keychain
      const result = await Keychain.getGenericPassword(keychainOptions)
      if (result) {
        // Delete from keychain
        await Keychain.resetGenericPassword({ service })
      }
    } catch (error) {
      // If key doesn't exist, that's fine - we still want to try to remove from device crypto
      Logger.warn('Key not found in keychain or authentication failed:', asError(error).message)
    }

    // Try to remove the encryption key from device crypto
    try {
      await DeviceCrypto.deleteKey(keyName)
    } catch (error) {
      // If the key doesn't exist in device crypto, that's acceptable
      Logger.warn('Key not found in device crypto:', asError(error).message)
    }
  }
}
