import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import Logger from '@/src/utils/logger'
export class KeyStorageService implements IKeyStorageService {
  private getKeychainKey(userId: string): string {
    return `signer_address_${userId}`
  }

  private getDelegatedKeychainKey(userId: string): string {
    return `delegated_signer_address_${userId}`
  }

  private getNonAuthKeyName(userId: string): string {
    return `nonauth_key_${userId}`
  }

  private async getOrCreateNonAuthKey(userId: string): Promise<string> {
    const keyName = this.getNonAuthKeyName(userId)

    try {
      await DeviceCrypto.getOrCreateAsymmetricKey(keyName, {
        accessLevel: 1, // No biometrics required
        invalidateOnNewBiometry: false,
      })

      return keyName
    } catch (error) {
      console.error('Error creating non-auth key:', error)
      throw new Error('Failed to create encryption key')
    }
  }

  async storePrivateKey(
    userId: string,
    privateKey: string,
    options: PrivateKeyStorageOptions = { requireAuthentication: true },
  ): Promise<void> {
    try {
      Logger.info('storePrivateKey', { userId, options })
      const { requireAuthentication = true } = options
      const isEmulator = await DeviceInfo.isEmulator()

      if (requireAuthentication) {
        await this.storeWithBiometrics(userId, privateKey, isEmulator)
      } else {
        await this.storeWithoutBiometrics(userId, privateKey)
      }
    } catch (err) {
      console.log(err)
      throw new Error('Failed to store private key')
    }
  }

  async getPrivateKey(
    userId: string,
    options: PrivateKeyStorageOptions = { requireAuthentication: true },
  ): Promise<string | undefined> {
    try {
      Logger.info('getPrivateKey', { userId, options })
      const { requireAuthentication = true } = options

      if (requireAuthentication) {
        return await this.getWithBiometrics(userId)
      } else {
        return await this.getWithoutBiometrics(userId)
      }
    } catch (err) {
      console.log(err)
      return undefined
    }
  }

  private async storeWithBiometrics(userId: string, privateKey: string, isEmulator: boolean): Promise<void> {
    Logger.info('storeWithBiometrics', { userId, isEmulator })
    const keychainKey = this.getKeychainKey(userId)

    await DeviceCrypto.getOrCreateAsymmetricKey(userId, {
      accessLevel: isEmulator ? 1 : 2,
      invalidateOnNewBiometry: true,
    })

    const encryptedPrivateKey = await DeviceCrypto.encrypt(userId, privateKey, {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Saving key',
      biometryDescription: 'Please authenticate yourself',
    })

    await Keychain.setGenericPassword(
      'signer_address',
      JSON.stringify({
        encryptedPassword: encryptedPrivateKey.encryptedText,
        iv: encryptedPrivateKey.iv,
      }),
      {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: keychainKey,
      },
    )

    // This enrols the biometry authentication in the device
    await Keychain.getGenericPassword({
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
      service: keychainKey,
    })
  }

  private async storeWithoutBiometrics(userId: string, privateKey: string): Promise<void> {
    Logger.info('storeWithoutBiometrics', { userId })
    const delegatedKeychainKey = this.getDelegatedKeychainKey(userId)

    // Get or create a non-biometric key
    const nonAuthKeyName = await this.getOrCreateNonAuthKey(userId)

    // Since we're using accessLevel: 1, biometrics won't be prompted even with these params
    const encryptedPrivateKey = await DeviceCrypto.encrypt(nonAuthKeyName, privateKey, {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Saving key',
      biometryDescription: 'Please authenticate yourself',
    })

    await Keychain.setGenericPassword(
      'signer_address',
      JSON.stringify({
        encryptedPassword: encryptedPrivateKey.encryptedText,
        iv: encryptedPrivateKey.iv,
      }),
      {
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: delegatedKeychainKey,
      },
    )
  }

  private async getWithBiometrics(userId: string): Promise<string> {
    Logger.info('getWithBiometrics', { userId })
    const keychainKey = this.getKeychainKey(userId)
    const user = await Keychain.getGenericPassword({
      service: keychainKey,
    })

    if (!user) {
      throw 'user password not found'
    }

    const { encryptedPassword, iv } = JSON.parse(user.password)
    const decryptedKey = await DeviceCrypto.decrypt(userId, encryptedPassword, iv, {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Signing',
      biometryDescription: 'Authenticate yourself to sign the text',
    })

    return decryptedKey
  }

  private async getWithoutBiometrics(userId: string): Promise<string> {
    Logger.info('getWithoutBiometrics', { userId })
    const delegatedKeychainKey = this.getDelegatedKeychainKey(userId)
    const result = await Keychain.getGenericPassword({
      service: delegatedKeychainKey,
    })

    if (!result) {
      throw 'user password not found'
    }

    // Get the non-auth key name
    const nonAuthKeyName = this.getNonAuthKeyName(userId)

    const { encryptedPassword, iv } = JSON.parse(result.password)
    const decryptedKey = await DeviceCrypto.decrypt(nonAuthKeyName, encryptedPassword, iv, {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Signing',
      biometryDescription: 'Authenticate yourself to sign the text',
    })

    return decryptedKey
  }
}
