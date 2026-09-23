import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { DdRum, ErrorSource } from 'expo-datadog'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import { BiometryInvalidationError, isBiometryInvalidationError, KeyStorageError } from './errors'
import Logger from '@/src/utils/logger'
import { Platform } from 'react-native'
import { asError } from '@safe-global/utils/services/exceptions/utils'

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
      // On the Android emulator there is no Strongbox, but the library can work without it
      // On iOS simulator we can't use the secureEnclave as there is none
      const isEmulator = Platform.OS === 'android' ? false : await DeviceInfo.isEmulator()
      await this.storeKey(userId, privateKey, requireAuthentication, isEmulator, 0)
    } catch (err) {
      throw new KeyStorageError(err)
    }
  }

  async getPrivateKey(
    userId: string,
    options: PrivateKeyStorageOptions = { requireAuthentication: true },
  ): Promise<string | undefined> {
    try {
      return await this.getKey(userId, options.requireAuthentication ?? true)
    } catch (err) {
      if (err === 'user password not found') {
        return undefined
      }

      if (isBiometryInvalidationError(err)) {
        Logger.warn('Signer encryption key is invalidated:', asError(err).message)
        DdRum.addError('BiometryInvalidationError', ErrorSource.SOURCE, asError(err).stack ?? '', {
          userId,
          location: 'getPrivateKey',
          platform: Platform.OS,
        })
        throw new BiometryInvalidationError(err)
      }

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

  private async storeKey(
    userId: string,
    privateKey: string,
    requireAuth: boolean,
    isEmulator: boolean,
    attempt: number,
  ): Promise<void> {
    const keyName = this.getKeyNameDeviceCrypto(userId)

    let operation = 'create'

    try {
      const options = {
        accessLevel: requireAuth ? (isEmulator ? 1 : 2) : 1,
        invalidateOnNewBiometry: requireAuth,
      }
      if (Platform.OS === 'android') {
        await DeviceCrypto.getOrCreateSymmetricKey(keyName, options)
      } else {
        await DeviceCrypto.getOrCreateAsymmetricKey(keyName, options)
      }

      operation = 'encrypt'
      const encryptedPrivateKey = await DeviceCrypto.encrypt(keyName, privateKey, this.BIOMETRIC_PROMPTS.SAVE)

      // iOS encryption uses the public key, so verify the private wrapping key before persisting.
      if (Platform.OS === 'ios') {
        operation = 'verify'
        const decryptedPrivateKey = await DeviceCrypto.decrypt(
          keyName,
          encryptedPrivateKey.encryptedText,
          encryptedPrivateKey.iv,
          this.BIOMETRIC_PROMPTS.SAVE,
        )
        if (decryptedPrivateKey !== privateKey) {
          throw new Error('Private key verification failed')
        }
      }

      operation = 'persist'
      const stored = await Keychain.setGenericPassword(
        'signer_address',
        JSON.stringify({
          encryptedPassword: encryptedPrivateKey.encryptedText,
          iv: encryptedPrivateKey.iv,
        }),
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, service: this.getKeyService(userId) },
      )
      if (!stored) {
        throw new Error('Failed to persist encrypted private key')
      }
    } catch (error) {
      Logger.error('Error storing private key', {
        operation,
        code: error instanceof Error && 'code' in error ? error.code : undefined,
        platform: Platform.OS,
      })
      if (operation !== 'persist' && attempt === 0 && isBiometryInvalidationError(error)) {
        // Keep the encrypted blob until its replacement has passed verification.
        if (!(await DeviceCrypto.deleteKey(keyName))) {
          throw new Error('Failed to remove invalidated encryption key')
        }
        return await this.storeKey(userId, privateKey, requireAuth, isEmulator, attempt + 1)
      }
      throw error
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
