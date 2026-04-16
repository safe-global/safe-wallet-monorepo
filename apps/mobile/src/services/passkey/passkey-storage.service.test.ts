import * as Keychain from 'react-native-keychain'
import {
  storePasskeyMetadata,
  getPasskeyMetadata,
  removePasskeyMetadata,
  updateDeployedChains,
  PasskeyMetadata,
} from './passkey-storage.service'

jest.mock('react-native-keychain')

const mockMetadata: PasskeyMetadata = {
  rawId: 'test-raw-id',
  coordinates: { x: '0x1234', y: '0x5678' },
  identityContractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  deployedOnChains: [],
}

describe('passkey-storage.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storePasskeyMetadata', () => {
    it('should store metadata in keychain', async () => {
      ;(Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true)

      await storePasskeyMetadata(mockMetadata)

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'passkey-metadata',
        JSON.stringify(mockMetadata),
        expect.objectContaining({
          accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
          service: 'safe-passkey-metadata',
        }),
      )
    })

    it('should throw on keychain failure', async () => {
      ;(Keychain.setGenericPassword as jest.Mock).mockRejectedValue(new Error('Keychain error'))

      await expect(storePasskeyMetadata(mockMetadata)).rejects.toThrow('Failed to store passkey metadata')
    })
  })

  describe('getPasskeyMetadata', () => {
    it('should return metadata from keychain', async () => {
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'passkey-metadata',
        password: JSON.stringify(mockMetadata),
      })

      const result = await getPasskeyMetadata()

      expect(result).toEqual(mockMetadata)
    })

    it('should return null when no metadata stored', async () => {
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false)

      const result = await getPasskeyMetadata()

      expect(result).toBeNull()
    })

    it('should return null on keychain error', async () => {
      ;(Keychain.getGenericPassword as jest.Mock).mockRejectedValue(new Error('Keychain error'))

      const result = await getPasskeyMetadata()

      expect(result).toBeNull()
    })
  })

  describe('removePasskeyMetadata', () => {
    it('should reset keychain password', async () => {
      ;(Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true)

      await removePasskeyMetadata()

      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'safe-passkey-metadata',
      })
    })
  })

  describe('updateDeployedChains', () => {
    it('should add chain to deployed list', async () => {
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'passkey-metadata',
        password: JSON.stringify(mockMetadata),
      })
      ;(Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true)

      await updateDeployedChains('1')

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'passkey-metadata',
        expect.stringContaining('"deployedOnChains":["1"]'),
        expect.anything(),
      )
    })

    it('should not duplicate chain in deployed list', async () => {
      const metadataWithChain = { ...mockMetadata, deployedOnChains: ['1'] }
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'passkey-metadata',
        password: JSON.stringify(metadataWithChain),
      })

      await updateDeployedChains('1')

      expect(Keychain.setGenericPassword).not.toHaveBeenCalled()
    })

    it('should throw if no metadata exists', async () => {
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false)

      await expect(updateDeployedChains('1')).rejects.toThrow('No passkey metadata found')
    })
  })
})
