import {
  transformSafeData,
  transformContactData,
  transformKeyData,
  storeSafes,
  storeKeys,
  storeContacts,
  LegacyDataStructure,
} from './transforms'
import { addSafe } from '@/src/store/safesSlice'
import { addContact, addContacts, Contact } from '@/src/store/addressBookSlice'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'

jest.mock('@/src/hooks/useSign/useSign', () => ({
  storePrivateKey: jest.fn(),
}))

jest.mock('@/src/store/signersSlice', () => ({
  addSignerWithEffects: jest.fn(() => ({ type: 'addSignerWithEffects' })),
}))

describe('Data import helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Pure transformation functions', () => {
    it('transforms safe data correctly', () => {
      const safeData = {
        address: '0x1',
        chain: '1',
        name: 'Test Safe',
        threshold: 2,
        owners: ['0x2', '0x3'],
      }

      const result = transformSafeData(safeData)

      expect(result).toEqual({
        address: { value: '0x1', name: 'Test Safe' },
        chainId: '1',
        threshold: 2,
        owners: [
          { value: '0x2', name: null },
          { value: '0x3', name: null },
        ],
        fiatTotal: '0',
        queued: 0,
        awaitingConfirmation: null,
      })
    })

    it('transforms contact data correctly', () => {
      const contactData = {
        address: '0x1',
        name: 'Alice',
        chain: '1',
      }

      const result = transformContactData(contactData)

      expect(result).toEqual({
        value: '0x1',
        name: 'Alice',
        chainIds: [],
      })
    })

    it('transforms key data correctly', () => {
      const key = Buffer.from('abcd', 'hex').toString('base64')
      const keyData = {
        address: '0x1',
        name: 'Owner',
        key,
      }

      const result = transformKeyData(keyData)

      expect(result).toEqual({
        address: '0x1',
        privateKey: '0xabcd',
        signerInfo: {
          value: '0x1',
          name: 'Owner',
        },
      })
    })
  })

  describe('Store functions', () => {
    it('dispatches addSafe and addContact for safes', () => {
      const dispatch = jest.fn()
      const data: LegacyDataStructure = {
        safes: [
          {
            address: '0x1',
            chain: '1',
            name: 'Test Safe',
            threshold: 2,
            owners: ['0x2'],
          },
        ],
      }

      storeSafes(data, dispatch)

      const expectedSafeOverview = {
        address: { value: '0x1', name: 'Test Safe' },
        chainId: '1',
        threshold: 2,
        owners: [{ value: '0x2', name: null }],
        fiatTotal: '0',
        queued: 0,
        awaitingConfirmation: null,
      }

      expect(dispatch).toHaveBeenCalledWith(addSafe({ address: '0x1', info: { '1': expectedSafeOverview } }))
      expect(dispatch).toHaveBeenCalledWith(addContact({ value: '0x1', name: 'Test Safe', chainIds: [] }))
    })

    it('stores keys and dispatches addSignerWithEffects', async () => {
      const dispatch = jest.fn()
      const key = Buffer.from('abcd', 'hex').toString('base64')
      const data: LegacyDataStructure = {
        keys: [
          {
            address: '0x1',
            name: 'Owner',
            key,
          },
        ],
      }

      await storeKeys(data, dispatch)

      expect(storePrivateKey).toHaveBeenCalledWith('0x1', '0xabcd')
      expect(addSignerWithEffects).toHaveBeenCalledWith({ value: '0x1', name: 'Owner' })
      expect(dispatch).toHaveBeenCalledWith({ type: 'addSignerWithEffects' })
    })

    it('dispatches addContacts', () => {
      const dispatch = jest.fn()
      const contacts: Contact[] = [
        { value: '0x1', name: 'Alice', chainIds: [] },
        { value: '0x2', name: 'Bob', chainIds: [] },
      ]
      const data: LegacyDataStructure = {
        contacts: [
          { address: '0x1', name: 'Alice', chain: '1' },
          { address: '0x2', name: 'Bob', chain: '1' },
        ],
      }

      storeContacts(data, dispatch)

      expect(dispatch).toHaveBeenCalledWith(addContacts(contacts))
    })
  })
})
