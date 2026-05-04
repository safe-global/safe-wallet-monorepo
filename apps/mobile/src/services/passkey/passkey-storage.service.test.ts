import * as Keychain from 'react-native-keychain'
import {
  addPasskeyMetadata,
  getAllPasskeyMetadata,
  getPasskeyMetadataByRawId,
  mobilePasskeyStorage,
  removePasskeyByRawId,
  updateDeployedChainsByRawId,
  type PasskeyMetadata,
} from './passkey-storage.service'

jest.mock('react-native-keychain')

const mockMetadata: PasskeyMetadata = {
  rawId: 'test-raw-id',
  coordinates: { x: '0x1234', y: '0x5678' },
  identityContractAddresses: { '11155111': '0xabcdef1234567890abcdef1234567890abcdef12' },
  deployedOnChains: [],
}

function mockKeychainWithCollection(collection: PasskeyMetadata[]) {
  ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
    username: 'passkey-metadata',
    password: JSON.stringify(collection),
  })
}

function mockKeychainEmpty() {
  ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false)
}

describe('passkey-storage.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true)
  })

  describe('getAllPasskeyMetadata', () => {
    it('returns empty array when no metadata stored', async () => {
      mockKeychainEmpty()
      expect(await getAllPasskeyMetadata()).toEqual([])
    })

    it('returns collection from keychain', async () => {
      mockKeychainWithCollection([mockMetadata])
      expect(await getAllPasskeyMetadata()).toEqual([mockMetadata])
    })

    it('filters invalid entries', async () => {
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'passkey-metadata',
        password: JSON.stringify([mockMetadata, { rawId: 'bad' }]),
      })
      expect(await getAllPasskeyMetadata()).toEqual([mockMetadata])
    })

    it('returns empty array on non-array stored value', async () => {
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'passkey-metadata',
        password: JSON.stringify(mockMetadata),
      })
      expect(await getAllPasskeyMetadata()).toEqual([])
    })
  })

  describe('getPasskeyMetadataByRawId', () => {
    it('returns matching entry', async () => {
      mockKeychainWithCollection([mockMetadata])
      expect(await getPasskeyMetadataByRawId('test-raw-id')).toEqual(mockMetadata)
    })

    it('returns null when not found', async () => {
      mockKeychainWithCollection([mockMetadata])
      expect(await getPasskeyMetadataByRawId('missing')).toBeNull()
    })
  })

  describe('addPasskeyMetadata', () => {
    it('appends to empty collection', async () => {
      mockKeychainEmpty()
      await addPasskeyMetadata(mockMetadata)
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'passkey-metadata',
        JSON.stringify([mockMetadata]),
        expect.objectContaining({
          accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
          service: 'safe-passkey-metadata',
        }),
      )
    })

    it('updates existing entry by rawId', async () => {
      mockKeychainWithCollection([mockMetadata])
      const updated = { ...mockMetadata, name: 'Updated' }
      await addPasskeyMetadata(updated)
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'passkey-metadata',
        JSON.stringify([updated]),
        expect.anything(),
      )
    })
  })

  describe('removePasskeyByRawId', () => {
    it('removes entry by rawId', async () => {
      const second: PasskeyMetadata = { ...mockMetadata, rawId: 'second-id' }
      mockKeychainWithCollection([mockMetadata, second])
      await removePasskeyByRawId('test-raw-id')
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'passkey-metadata',
        JSON.stringify([second]),
        expect.anything(),
      )
    })
  })

  describe('setIdentityForChain', () => {
    it('adds a per-chain address to the map', async () => {
      mockKeychainWithCollection([mockMetadata])
      await mobilePasskeyStorage.setIdentityForChain('test-raw-id', '1', '0xMainnetAddr')
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'passkey-metadata',
        expect.stringContaining('"1":"0xMainnetAddr"'),
        expect.anything(),
      )
    })

    it('does not write when address is unchanged', async () => {
      mockKeychainWithCollection([mockMetadata])
      await mobilePasskeyStorage.setIdentityForChain(
        'test-raw-id',
        '11155111',
        '0xabcdef1234567890abcdef1234567890abcdef12',
      )
      expect(Keychain.setGenericPassword).not.toHaveBeenCalled()
    })
  })

  describe('updateDeployedChainsByRawId', () => {
    it('adds chain to deployed list', async () => {
      mockKeychainWithCollection([mockMetadata])
      await updateDeployedChainsByRawId('test-raw-id', '1')
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'passkey-metadata',
        expect.stringContaining('"deployedOnChains":["1"]'),
        expect.anything(),
      )
    })

    it('does not duplicate chains', async () => {
      mockKeychainWithCollection([{ ...mockMetadata, deployedOnChains: ['1'] }])
      await updateDeployedChainsByRawId('test-raw-id', '1')
      expect(Keychain.setGenericPassword).not.toHaveBeenCalled()
    })

    it('throws if rawId not found', async () => {
      mockKeychainEmpty()
      await expect(updateDeployedChainsByRawId('nonexistent', '1')).rejects.toThrow(
        'No passkey metadata found for rawId',
      )
    })
  })
})
