import { faker } from '@faker-js/faker'
import { KeyStorageService } from './key-storage.service'
import { BiometryInvalidationError, KeyStorageError, MissingWrappingKeyError, MissingStoredKeyError } from './errors'
import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { Platform } from 'react-native'
import Logger from '@/src/utils/logger'

const mockDeviceCrypto = DeviceCrypto as jest.Mocked<typeof DeviceCrypto>
const mockKeychain = Keychain as jest.Mocked<typeof Keychain>
const mockDeviceInfo = DeviceInfo as jest.Mocked<typeof DeviceInfo>

describe('KeyStorageService', () => {
  let service: KeyStorageService
  const userId = faker.finance.ethereumAddress()
  const privateKey = faker.string.hexadecimal({ length: 64, prefix: '0x' })

  beforeEach(() => {
    jest.resetAllMocks()
    service = new KeyStorageService()
    ;(Platform.OS as string) = 'ios'
    mockDeviceCrypto.decrypt.mockResolvedValue(privateKey)
    mockDeviceCrypto.deleteKey.mockResolvedValue(true)
    mockKeychain.setGenericPassword.mockResolvedValue({
      service: 'test-service',
      storage: Keychain.STORAGE_TYPE.AES_GCM,
    })
  })

  describe('storePrivateKey', () => {
    describe('on iOS', () => {
      beforeEach(() => {
        ;(Platform.OS as string) = 'ios'
        mockDeviceInfo.isEmulator.mockResolvedValue(false)
      })

      it('stores private key with asymmetric encryption', async () => {
        mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')
        mockDeviceCrypto.encrypt.mockResolvedValue({
          encryptedText: 'encrypted',
          iv: 'iv-value',
        })
        mockKeychain.setGenericPassword.mockResolvedValue({
          service: 'test-service',
          storage: Keychain.STORAGE_TYPE.AES_GCM,
        })

        await service.storePrivateKey(userId, privateKey)

        expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalled()
        expect(mockDeviceCrypto.encrypt).toHaveBeenCalled()
        expect(mockKeychain.setGenericPassword).toHaveBeenCalled()
      })

      it('stores private key without authentication when option is false', async () => {
        mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')
        mockDeviceCrypto.encrypt.mockResolvedValue({
          encryptedText: 'encrypted',
          iv: 'iv-value',
        })
        mockKeychain.setGenericPassword.mockResolvedValue({
          service: 'test-service',
          storage: Keychain.STORAGE_TYPE.AES_GCM,
        })

        await service.storePrivateKey(userId, privateKey, { requireAuthentication: false })

        expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ accessLevel: 1 }),
        )
      })

      it('uses lower access level on emulator', async () => {
        mockDeviceInfo.isEmulator.mockResolvedValue(true)
        mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')
        mockDeviceCrypto.encrypt.mockResolvedValue({
          encryptedText: 'encrypted',
          iv: 'iv-value',
        })
        mockKeychain.setGenericPassword.mockResolvedValue({
          service: 'test-service',
          storage: Keychain.STORAGE_TYPE.AES_GCM,
        })

        await service.storePrivateKey(userId, privateKey)

        expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ accessLevel: 1 }),
        )
      })

      it('throws error on key creation failure', async () => {
        mockDeviceCrypto.getOrCreateAsymmetricKey.mockRejectedValue(new Error('Key creation failed'))

        await expect(service.storePrivateKey(userId, privateKey)).rejects.toThrow('Failed to store private key')
      })

      it('throws error on encryption failure', async () => {
        mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')
        mockDeviceCrypto.encrypt.mockRejectedValue(new Error('Encryption failed'))

        await expect(service.storePrivateKey(userId, privateKey)).rejects.toThrow('Failed to store private key')
      })
    })

    describe('on Android', () => {
      beforeEach(() => {
        ;(Platform.OS as string) = 'android'
      })

      it('stores private key with symmetric encryption', async () => {
        mockDeviceCrypto.getOrCreateSymmetricKey.mockResolvedValue(undefined as never)
        mockDeviceCrypto.encrypt.mockResolvedValue({
          encryptedText: 'encrypted',
          iv: 'iv-value',
        })
        mockKeychain.setGenericPassword.mockResolvedValue({
          service: 'test-service',
          storage: Keychain.STORAGE_TYPE.AES_GCM,
        })

        await service.storePrivateKey(userId, privateKey)

        expect(mockDeviceCrypto.getOrCreateSymmetricKey).toHaveBeenCalled()
        expect(mockDeviceCrypto.encrypt).toHaveBeenCalled()
        expect(mockKeychain.setGenericPassword).toHaveBeenCalled()
      })

      it('throws error on symmetric key creation failure', async () => {
        mockDeviceCrypto.getOrCreateSymmetricKey.mockRejectedValue(new Error('Symmetric key creation failed'))

        await expect(service.storePrivateKey(userId, privateKey)).rejects.toThrow('Failed to store private key')
      })
    })
  })

  describe('getPrivateKey', () => {
    it('retrieves and decrypts private key', async () => {
      const encryptedData = JSON.stringify({ encryptedPassword: 'encrypted', iv: 'iv-value' })
      mockKeychain.getGenericPassword.mockResolvedValue({
        username: 'signer_address',
        password: encryptedData,
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })
      mockDeviceCrypto.decrypt.mockResolvedValue(privateKey)

      const result = await service.getPrivateKey(userId)

      expect(result).toBe(privateKey)
      expect(mockKeychain.getGenericPassword).toHaveBeenCalled()
      expect(mockDeviceCrypto.decrypt).toHaveBeenCalled()
    })

    it('returns undefined when password not found', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)

      const result = await service.getPrivateKey(userId)

      expect(result).toBeUndefined()
    })

    it('distinguishes a missing entry when cleanup requests it', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)

      await expect(service.getPrivateKey(userId, { throwIfMissing: true })).rejects.toBeInstanceOf(
        MissingStoredKeyError,
      )
      expect(mockDeviceCrypto.decrypt).not.toHaveBeenCalled()
    })

    it('does not classify a cancelled Keychain read as confirmed absence', async () => {
      mockKeychain.getGenericPassword.mockRejectedValue(new Error('Status: -128'))

      await expect(service.getPrivateKey(userId, { throwIfMissing: true })).resolves.toBeUndefined()
      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
    })

    it('returns undefined on decryption error', async () => {
      const encryptedData = JSON.stringify({ encryptedPassword: 'encrypted', iv: 'iv-value' })
      mockKeychain.getGenericPassword.mockResolvedValue({
        username: 'signer_address',
        password: encryptedData,
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })
      mockDeviceCrypto.decrypt.mockRejectedValue(new Error('Decryption failed'))

      const result = await service.getPrivateKey(userId)

      expect(result).toBeUndefined()
    })

    it('applies access control when authentication is required', async () => {
      const encryptedData = JSON.stringify({ encryptedPassword: 'encrypted', iv: 'iv-value' })
      mockKeychain.getGenericPassword.mockResolvedValue({
        username: 'signer_address',
        password: encryptedData,
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })
      mockDeviceCrypto.decrypt.mockResolvedValue(privateKey)

      await service.getPrivateKey(userId, { requireAuthentication: true })

      expect(mockKeychain.getGenericPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
        }),
      )
    })
  })

  describe('removePrivateKey', () => {
    beforeEach(() => {
      mockDeviceCrypto.authenticateWithBiometry.mockResolvedValue(true)
      mockKeychain.resetGenericPassword.mockResolvedValue(true)
    })

    it('authenticates independently and deletes without reading the private key', async () => {
      await service.removePrivateKey(userId)

      expect(mockDeviceCrypto.authenticateWithBiometry).toHaveBeenCalledTimes(1)
      expect(mockKeychain.getGenericPassword).not.toHaveBeenCalled()
      expect(mockDeviceCrypto.decrypt).not.toHaveBeenCalled()
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalledWith(`signer_address_${userId}`)
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: `signer_address_${userId}_encrypted_storage`,
      })
    })

    it.each(['ios', 'android'])('uses biometric authentication for removal on %s', async (platform) => {
      ;(Platform.OS as string) = platform
      await service.removePrivateKey(userId)

      expect(mockDeviceCrypto.authenticateWithBiometry).toHaveBeenCalledWith({
        biometryTitle: 'Authenticate',
        biometrySubTitle: 'Removing signer',
        biometryDescription: 'Authenticate to remove this signer from your device',
      })
    })

    it('preserves structured removal authentication errors without deleting anything', async () => {
      const cause = Object.assign(new Error('Localized native description'), { code: 'E_AUTHENTICATION_-7' })
      mockDeviceCrypto.authenticateWithBiometry.mockRejectedValue(cause)

      await expect(service.removePrivateKey(userId)).rejects.toMatchObject({
        message: 'Enable biometrics and allow this app to use them, then try again.',
        cause,
      })
      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled()
    })

    it.each(['cancelled', 'rejected'])('does not delete when authentication is %s', async (failure) => {
      if (failure === 'cancelled') {
        mockDeviceCrypto.authenticateWithBiometry.mockResolvedValue(false)
      } else {
        mockDeviceCrypto.authenticateWithBiometry.mockRejectedValue(new Error('Locked out'))
      }

      await expect(service.removePrivateKey(userId)).rejects.toThrow(
        failure === 'cancelled' ? 'Authentication was cancelled' : 'Failed to remove private key',
      )

      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled()
    })

    it('preserves the option to delete delegate keys without authentication', async () => {
      await service.removePrivateKey(userId, { requireAuthentication: false })

      expect(mockDeviceCrypto.authenticateWithBiometry).not.toHaveBeenCalled()
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalled()
    })

    it.each(['rejected', 'false'])('preserves ciphertext when wrapping-key deletion returns %s', async (failure) => {
      if (failure === 'rejected') {
        mockDeviceCrypto.deleteKey.mockRejectedValue(new Error('Deletion failed'))
      } else {
        mockDeviceCrypto.deleteKey.mockResolvedValue(false)
      }

      await expect(service.removePrivateKey(userId)).rejects.toThrow('Failed to remove private key')

      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled()
    })

    it.each(['rejected', 'false'])('reports ciphertext deletion failure: %s', async (failure) => {
      if (failure === 'rejected') {
        mockKeychain.resetGenericPassword.mockRejectedValue(new Error('Deletion failed'))
      } else {
        mockKeychain.resetGenericPassword.mockResolvedValue(false)
      }

      await expect(service.removePrivateKey(userId)).rejects.toThrow('Failed to remove private key')
    })
  })

  describe('key invalidation handling', () => {
    it('retries storage after key invalidation on iOS (AKSError fingerprint)', async () => {
      ;(Platform.OS as string) = 'ios'
      mockDeviceInfo.isEmulator.mockResolvedValue(false)
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')

      mockDeviceCrypto.encrypt
        .mockRejectedValueOnce(new Error('Domain=CryptoTokenKit Code=-3 ... AKSError=-536362999'))
        .mockResolvedValueOnce({ encryptedText: 'encrypted', iv: 'iv-value' })

      mockKeychain.getGenericPassword.mockResolvedValue(false)
      mockKeychain.resetGenericPassword.mockResolvedValue(true)
      mockDeviceCrypto.deleteKey.mockResolvedValue(true)
      mockKeychain.setGenericPassword.mockResolvedValue({
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })

      await service.storePrivateKey(userId, privateKey)

      expect(mockDeviceCrypto.encrypt).toHaveBeenCalledTimes(2)
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
    })

    it('retries storage when iOS verification reveals an orphan SE key', async () => {
      ;(Platform.OS as string) = 'ios'
      mockDeviceInfo.isEmulator.mockResolvedValue(false)
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')

      mockDeviceCrypto.encrypt.mockResolvedValue({ encryptedText: 'encrypted', iv: 'iv-value' })
      mockDeviceCrypto.decrypt
        .mockRejectedValueOnce(new Error('Domain=CryptoTokenKit Code=-3 ... AKSError=-536362999'))
        .mockResolvedValueOnce(privateKey)

      mockKeychain.getGenericPassword.mockResolvedValue(false)
      mockKeychain.resetGenericPassword.mockResolvedValue(true)
      mockDeviceCrypto.deleteKey.mockResolvedValue(true)
      mockKeychain.setGenericPassword.mockResolvedValue({
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })

      await service.storePrivateKey(userId, privateKey)

      expect(mockDeviceCrypto.encrypt).toHaveBeenCalledTimes(2)
      expect(mockDeviceCrypto.decrypt).toHaveBeenCalledTimes(2)
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
      expect(mockKeychain.setGenericPassword).toHaveBeenCalledTimes(1)
    })

    it('retries storage after key invalidation on Android (KeyPermanentlyInvalidatedException)', async () => {
      ;(Platform.OS as string) = 'android'
      mockDeviceCrypto.getOrCreateSymmetricKey.mockResolvedValue(undefined as never)

      mockDeviceCrypto.encrypt
        .mockRejectedValueOnce(new Error('Key permanently invalidated'))
        .mockResolvedValueOnce({ encryptedText: 'encrypted', iv: 'iv-value' })

      mockKeychain.getGenericPassword.mockResolvedValue(false)
      mockKeychain.resetGenericPassword.mockResolvedValue(true)
      mockDeviceCrypto.deleteKey.mockResolvedValue(true)
      mockKeychain.setGenericPassword.mockResolvedValue({
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })

      await service.storePrivateKey(userId, privateKey)

      expect(mockDeviceCrypto.encrypt).toHaveBeenCalledTimes(2)
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
    })
  })

  describe('import recovery', () => {
    beforeEach(() => {
      mockDeviceInfo.isEmulator.mockResolvedValue(false)
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')
      mockDeviceCrypto.encrypt.mockResolvedValue({ encryptedText: 'encrypted', iv: 'iv-value' })
    })

    it('logs successful invalidation recovery as information without an error or warning', async () => {
      mockDeviceCrypto.decrypt.mockRejectedValueOnce(
        Object.assign(new Error('AKSError=-536362999'), { code: 'E1760 - Decryption error.' }),
      )

      await service.storePrivateKey(userId, privateKey)

      expect(Logger.info).toHaveBeenCalledWith(
        'Recovering invalidated signer encryption key',
        expect.objectContaining({
          operation: 'verify',
          code: 'E1760 - Decryption error.',
          aksCode: '-536362999',
          platform: 'ios',
        }),
      )
      expect(Logger.error).not.toHaveBeenCalled()
      expect(Logger.warn).not.toHaveBeenCalled()
    })

    it('logs the failed phase and native status without arbitrary error messages', async () => {
      mockDeviceCrypto.decrypt.mockRejectedValue(new Error(`Status: -25293 ${privateKey}`))

      await expect(service.storePrivateKey(userId, privateKey)).rejects.toBeInstanceOf(KeyStorageError)

      expect(Logger.error).toHaveBeenCalledWith(
        'Error storing private key',
        expect.objectContaining({
          operation: 'verify',
          osStatus: '-25293',
          domain: 'NSOSStatusErrorDomain',
        }),
      )
      expect(JSON.stringify(jest.mocked(Logger.error).mock.calls)).not.toContain(privateKey)
    })

    it('recovers from invalidation during key lookup and retrieves the re-imported key', async () => {
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockRejectedValueOnce(new Error('AKSError=-536362999'))
      mockKeychain.setGenericPassword.mockImplementation(async (_username, password) => {
        mockKeychain.getGenericPassword.mockResolvedValue({
          username: 'signer_address',
          password,
          service: 'test-service',
          storage: Keychain.STORAGE_TYPE.AES_GCM,
        })
        return { service: 'test-service', storage: Keychain.STORAGE_TYPE.AES_GCM }
      })

      await service.storePrivateKey(userId, privateKey)

      expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalledTimes(2)
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalledTimes(1)
      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled()
      await expect(service.getPrivateKey(userId)).resolves.toBe(privateKey)
    })

    it('waits for deletion before recreating the wrapping key', async () => {
      let finishDeletion!: (result: boolean) => void
      let deletionStarted!: () => void
      const started = new Promise<void>((resolve) => {
        deletionStarted = resolve
      })
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockRejectedValueOnce(new Error('AKSError=-536362999'))
      mockDeviceCrypto.deleteKey.mockImplementation(() => {
        deletionStarted()
        return new Promise<boolean>((resolve) => {
          finishDeletion = resolve
        })
      })

      const storing = service.storePrivateKey(userId, privateKey)
      await started
      expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalledTimes(1)
      expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled()

      finishDeletion(true)
      await storing
      expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalledTimes(2)
    })

    it.each(['reject', 'false'])('does not retry if deletion returns %s', async (failure) => {
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockRejectedValueOnce(new Error('AKSError=-536362999'))
      if (failure === 'reject') {
        mockDeviceCrypto.deleteKey.mockRejectedValueOnce(new Error('Status: -25293'))
      } else {
        mockDeviceCrypto.deleteKey.mockResolvedValueOnce(false)
      }

      await expect(service.storePrivateKey(userId, privateKey)).rejects.toBeInstanceOf(KeyStorageError)

      expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalledTimes(1)
      expect(Logger.error).toHaveBeenCalledTimes(1)
      expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled()
      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled()
    })

    it('stops after one recovery attempt and preserves the native cause', async () => {
      const nativeError = Object.assign(new Error('AKSError=-536362999'), { code: 'E1712' })
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockRejectedValue(nativeError)

      await expect(service.storePrivateKey(userId, privateKey)).rejects.toMatchObject({ cause: nativeError })

      expect(Logger.error).toHaveBeenCalledTimes(1)
      expect(mockDeviceCrypto.getOrCreateAsymmetricKey).toHaveBeenCalledTimes(2)
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalledTimes(1)
      expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled()
    })

    it.each([
      'Status: -25293',
      'OSStatus error -25293',
      'Status: -128',
      'LAErrorDomain Code=-2',
      'LAErrorDomain Code=-8',
      'LAErrorDomain Code=-7',
      'The device cannot meet requirements. No biometry has been enrolled.',
    ])('preserves storage on authentication failure: %s', async (message) => {
      mockDeviceCrypto.decrypt.mockRejectedValueOnce(new Error(message))

      await expect(service.storePrivateKey(userId, privateKey)).rejects.toBeInstanceOf(KeyStorageError)

      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled()
      expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled()
    })

    it('does not persist or delete keys when verification returns a different value', async () => {
      mockDeviceCrypto.decrypt.mockResolvedValueOnce('incorrect')

      await expect(service.storePrivateKey(userId, privateKey)).rejects.toThrow('Failed to store private key')

      expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled()
      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
    })

    it.each(['Storage unavailable', 'AKSError=-536362999'])(
      'does not delete the wrapping key when persistence fails: %s',
      async (message) => {
        mockKeychain.setGenericPassword.mockRejectedValueOnce(new Error(message))

        await expect(service.storePrivateKey(userId, privateKey)).rejects.toThrow('Failed to store private key')

        expect(Logger.error).toHaveBeenCalledTimes(1)
        expect(Logger.info).not.toHaveBeenCalled()
        expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
        expect(mockKeychain.setGenericPassword).toHaveBeenCalledTimes(1)
      },
    )

    it('rejects import when persistence returns false', async () => {
      mockKeychain.setGenericPassword.mockResolvedValueOnce(false)

      await expect(service.storePrivateKey(userId, privateKey)).rejects.toThrow('Failed to store private key')

      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
    })
  })

  describe('getPrivateKey biometry invalidation', () => {
    const mockKeychainEntry = () => {
      const encryptedData = JSON.stringify({ encryptedPassword: 'encrypted', iv: 'iv-value' })
      mockKeychain.getGenericPassword.mockResolvedValue({
        username: 'signer_address',
        password: encryptedData,
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })
    }

    it('reports an explicitly missing iOS wrapping key', async () => {
      mockKeychainEntry()
      const cause = Object.assign(new Error('Private wrapping key missing'), { code: 'E_PRIVATE_KEY_MISSING' })
      mockDeviceCrypto.decrypt.mockRejectedValue(cause)

      await expect(service.getPrivateKey(userId)).rejects.toBeInstanceOf(MissingWrappingKeyError)
      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
    })

    it('does not interpret a generic item-not-found error as a missing wrapping key', async () => {
      mockKeychainEntry()
      mockDeviceCrypto.decrypt.mockRejectedValue(Object.assign(new Error('Item not found'), { code: '-25300' }))

      await expect(service.getPrivateKey(userId)).resolves.toBeUndefined()
      expect(mockDeviceCrypto.deleteKey).not.toHaveBeenCalled()
    })

    it('throws BiometryInvalidationError for iOS AKSError fingerprint', async () => {
      ;(Platform.OS as string) = 'ios'
      mockKeychainEntry()
      mockDeviceCrypto.decrypt.mockRejectedValue(
        new Error(
          'Error Domain=CryptoTokenKit Code=-3 "unable to compute shared secret" ' + 'UserInfo={AKSError=-536362999}',
        ),
      )

      await expect(service.getPrivateKey(userId)).rejects.toBeInstanceOf(BiometryInvalidationError)
    })

    it('throws BiometryInvalidationError for Android KeyPermanentlyInvalidatedException', async () => {
      ;(Platform.OS as string) = 'android'
      mockKeychainEntry()
      mockDeviceCrypto.decrypt.mockRejectedValue(new Error('Key permanently invalidated'))

      await expect(service.getPrivateKey(userId)).rejects.toBeInstanceOf(BiometryInvalidationError)
    })

    it('returns undefined for Android ERROR_CANCELED (user-driven cancel)', async () => {
      ;(Platform.OS as string) = 'android'
      mockKeychainEntry()
      mockDeviceCrypto.decrypt.mockRejectedValue(new Error('5- Fingerprint operation Cancelled'))

      const result = await service.getPrivateKey(userId)

      expect(result).toBeUndefined()
    })

    it('returns undefined for benign decrypt failures (not biometry-related)', async () => {
      ;(Platform.OS as string) = 'ios'
      mockKeychainEntry()
      mockDeviceCrypto.decrypt.mockRejectedValue(new Error('Some unrelated decrypt error'))

      const result = await service.getPrivateKey(userId)

      expect(result).toBeUndefined()
    })

    it('returns undefined when no keychain entry exists', async () => {
      ;(Platform.OS as string) = 'ios'
      mockKeychain.getGenericPassword.mockResolvedValue(false)

      const result = await service.getPrivateKey(userId)

      expect(result).toBeUndefined()
    })
  })
})
