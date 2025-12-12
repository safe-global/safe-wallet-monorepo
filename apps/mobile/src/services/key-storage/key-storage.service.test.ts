import { faker } from '@faker-js/faker'
import { KeyStorageService } from './key-storage.service'
import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { Platform } from 'react-native'

const mockDeviceCrypto = DeviceCrypto as jest.Mocked<typeof DeviceCrypto>
const mockKeychain = Keychain as jest.Mocked<typeof Keychain>
const mockDeviceInfo = DeviceInfo as jest.Mocked<typeof DeviceInfo>

describe('KeyStorageService', () => {
  let service: KeyStorageService
  const userId = faker.finance.ethereumAddress()
  const privateKey = faker.string.hexadecimal({ length: 64, prefix: '0x' })

  beforeEach(() => {
    jest.clearAllMocks()
    service = new KeyStorageService()
    ;(Platform.OS as string) = 'ios'
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
    it('removes key from keychain and device crypto', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        username: 'signer_address',
        password: 'encrypted',
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })
      mockKeychain.resetGenericPassword.mockResolvedValue(true)
      mockDeviceCrypto.deleteKey.mockResolvedValue(undefined as never)

      await service.removePrivateKey(userId)

      expect(mockKeychain.resetGenericPassword).toHaveBeenCalled()
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
    })

    it('continues to delete crypto key even if keychain key not found', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)
      mockDeviceCrypto.deleteKey.mockResolvedValue(undefined as never)

      await service.removePrivateKey(userId)

      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled()
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
    })

    it('handles keychain authentication failure gracefully', async () => {
      mockKeychain.getGenericPassword.mockRejectedValue(new Error('Auth failed'))
      mockDeviceCrypto.deleteKey.mockResolvedValue(undefined as never)

      await service.removePrivateKey(userId)

      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
    })

    it('handles device crypto delete failure gracefully', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)
      mockDeviceCrypto.deleteKey.mockRejectedValue(new Error('Key not found'))

      await expect(service.removePrivateKey(userId)).resolves.not.toThrow()
    })

    it('handles all failures gracefully without throwing', async () => {
      mockKeychain.getGenericPassword.mockRejectedValue(new Error('Unexpected error'))
      mockDeviceCrypto.deleteKey.mockRejectedValue(new Error('Also fails'))

      await expect(service.removePrivateKey(userId)).resolves.not.toThrow()
    })
  })

  describe('key invalidation handling', () => {
    it('retries storage after key invalidation', async () => {
      ;(Platform.OS as string) = 'ios'
      mockDeviceInfo.isEmulator.mockResolvedValue(false)
      mockDeviceCrypto.getOrCreateAsymmetricKey.mockResolvedValue('key-name')

      mockDeviceCrypto.encrypt
        .mockRejectedValueOnce(new Error('Key permanently invalidated'))
        .mockResolvedValueOnce({ encryptedText: 'encrypted', iv: 'iv-value' })

      mockKeychain.getGenericPassword.mockResolvedValue(false)
      mockKeychain.resetGenericPassword.mockResolvedValue(true)
      mockDeviceCrypto.deleteKey.mockResolvedValue(undefined as never)
      mockKeychain.setGenericPassword.mockResolvedValue({
        service: 'test-service',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      })

      await service.storePrivateKey(userId, privateKey)

      expect(mockDeviceCrypto.encrypt).toHaveBeenCalledTimes(2)
      expect(mockDeviceCrypto.deleteKey).toHaveBeenCalled()
    })
  })
})
