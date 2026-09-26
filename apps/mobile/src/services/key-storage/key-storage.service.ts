import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { DdRum, ErrorSource } from 'expo-datadog'
import { IKeyStorageService, PrivateKeyStorageOptions, PrivateKeyReadOptions } from './types'
import {
  BiometryInvalidationError,
  isBiometryInvalidationError,
  KeyStorageError,
  MissingWrappingKeyError,
  MissingStoredKeyError,
  KeyStorageOperation,
} from './errors'
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
    REMOVE: {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Removing signer',
      biometryDescription: 'Authenticate to remove this signer from your device',
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
      const error = err instanceof KeyStorageError ? err : new KeyStorageError(err)
      Logger.error('Error storing private key', {
        ...error.diagnostics,
        platform: Platform.OS,
      })
      throw error
    }
  }

  async getPrivateKey(
    userId: string,
    options: PrivateKeyReadOptions = { requireAuthentication: true },
  ): Promise<string | undefined> {
    try {
      return await this.getKey(userId, options.requireAuthentication ?? true)
    } catch (err) {
      if (err instanceof MissingStoredKeyError) {
        if (options.throwIfMissing) {
          throw err
        }
        return undefined
      }

      if (Platform.OS === 'ios' && err instanceof Error && 'code' in err && err.code === 'E_PRIVATE_KEY_MISSING') {
        throw new MissingWrappingKeyError(err)
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
      const error = new KeyStorageError(err, 'remove')
      Logger.error('Error removing private key', { ...error.diagnostics, platform: Platform.OS })
      throw error
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

    let operation: KeyStorageOperation = 'create'

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
      if (operation !== 'persist' && attempt === 0 && isBiometryInvalidationError(error)) {
        Logger.info('Recovering invalidated signer encryption key', {
          ...new KeyStorageError(error, 'store', operation).diagnostics,
          platform: Platform.OS,
        })
        // Keep the encrypted blob until its replacement has passed verification.
        try {
          if (!(await DeviceCrypto.deleteKey(keyName))) {
            throw new Error('Failed to remove invalidated encryption key')
          }
        } catch (deletionError) {
          throw new KeyStorageError(deletionError, 'store', 'recover')
        }
        return await this.storeKey(userId, privateKey, requireAuth, isEmulator, attempt + 1)
      }
      throw new KeyStorageError(error, 'store', operation)
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
      throw new MissingStoredKeyError()
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

    if (requireAuth && !(await DeviceCrypto.authenticateWithBiometry(this.BIOMETRIC_PROMPTS.REMOVE))) {
      throw Object.assign(new Error('Authentication was cancelled'), { code: 'E_AUTHENTICATION_-2' })
    }

    if (!(await DeviceCrypto.deleteKey(keyName))) {
      throw new Error('Failed to remove encryption key')
    }
    if (!(await Keychain.resetGenericPassword({ service }))) {
      throw new Error('Failed to remove encrypted private key')
    }
  }
}
