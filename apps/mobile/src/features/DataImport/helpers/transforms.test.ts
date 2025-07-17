import {
  transformSafeData,
  transformKeyData,
  transformContactsData,
  fetchAndStoreSafeOverviews,
  storeSafeContacts,
  storeContacts,
  storeKeysWithValidation,
  LegacyDataStructure,
  ImportProgressCallback,
} from './transforms'
import { addContact, addContacts } from '@/src/store/addressBookSlice'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'

jest.mock('@/src/hooks/useSign/useSign', () => ({
  storePrivateKey: jest.fn(),
}))

jest.mock('@/src/store/signersSlice', () => ({
  addSignerWithEffects: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/safes', () => ({
  additionalSafesRtkApi: {
    endpoints: {
      safesGetOverviewForMany: {
        initiate: jest.fn(),
      },
    },
  },
}))

describe('Data import helpers', () => {
  const mockCreateDelegate = jest.fn()
  const mockDispatch = jest.fn()
  const mockProgressCallback: ImportProgressCallback = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockCreateDelegate.mockResolvedValue({ success: true, delegateAddress: '0xDelegate' })

    // Ensure all async mocks return resolved promises
    ;(storePrivateKey as jest.Mock).mockResolvedValue(undefined)
    ;(addSignerWithEffects as jest.Mock).mockReturnValue({ type: 'addSignerWithEffects' })

    // Mock the RTK query
    const mockQueryResult = {
      unwrap: jest.fn().mockResolvedValue([
        {
          address: { value: '0x1', name: 'Test Safe' },
          chainId: '1',
          threshold: 2,
          owners: [
            { value: '0x2', name: null },
            { value: '0x3', name: null },
          ],
          fiatTotal: '1000.00',
          queued: 3,
          awaitingConfirmation: null,
        },
      ]),
    }
    const mockInitiateAction = { type: 'safesGetOverviewForMany' }
    ;(additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate as jest.Mock).mockReturnValue(mockInitiateAction)

    // Mock dispatch to return the query result only for the RTK query action
    mockDispatch.mockImplementation((action) => {
      if (action === mockInitiateAction) {
        return mockQueryResult
      }
      return { type: action.type } // Return action-like object for other dispatches
    })
  })

  afterEach(() => {
    // Only run timer methods if fake timers are active
    if (jest.isMockFunction(setTimeout)) {
      jest.runOnlyPendingTimers()
    }
    jest.useRealTimers()
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

    it('transforms contact data correctly', () => {
      const contactsData = [
        {
          address: '0x1',
          name: 'Contact 1',
          chain: '1',
        },
        {
          address: '0x2',
          name: 'Contact 2',
          chain: '137',
        },
      ]

      const result = transformContactsData(contactsData)

      expect(result).toEqual([
        {
          value: '0x1',
          name: 'Contact 1',
          chainIds: ['1'],
        },
        {
          value: '0x2',
          name: 'Contact 2',
          chainIds: ['137'],
        },
      ])
    })
  })

  describe('Store functions', () => {
    it('fetchAndStoreSafeOverviews fetches and returns owners', async () => {
      const safes = [
        { address: '0x1', chainId: '1' },
        { address: '0x2', chainId: '137' },
      ]

      const result = await fetchAndStoreSafeOverviews(safes, 'USD', mockDispatch, mockProgressCallback)

      expect(additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate).toHaveBeenCalledWith({
        safes: ['1:0x1', '137:0x2'],
        currency: 'USD',
        trusted: true,
        excludeSpam: true,
      })

      expect(result).toEqual(new Set(['0x2', '0x3']))
      expect(mockProgressCallback).toHaveBeenCalled()
    })

    it('storeSafeContacts dispatches addContact for each safe', () => {
      const data: LegacyDataStructure = {
        safes: [
          {
            address: '0x1',
            chain: '1',
            name: 'Test Safe',
            threshold: 2,
            owners: ['0x2'],
          },
          {
            address: '0x2',
            chain: '137',
            name: 'Test Safe 2',
            threshold: 1,
            owners: ['0x3'],
          },
        ],
      }

      storeSafeContacts(data, mockDispatch)

      expect(mockDispatch).toHaveBeenCalledWith(addContact({ value: '0x1', name: 'Test Safe', chainIds: [] }))
      expect(mockDispatch).toHaveBeenCalledWith(addContact({ value: '0x2', name: 'Test Safe 2', chainIds: [] }))
    })

    it('storeContacts dispatches addContacts', () => {
      const data: LegacyDataStructure = {
        contacts: [
          {
            address: '0x1',
            name: 'Contact 1',
            chain: '1',
          },
          {
            address: '0x2',
            name: 'Contact 2',
            chain: '137',
          },
        ],
      }

      storeContacts(data, mockDispatch)

      expect(mockDispatch).toHaveBeenCalledWith(
        addContacts([
          { value: '0x1', name: 'Contact 1', chainIds: ['1'] },
          { value: '0x2', name: 'Contact 2', chainIds: ['137'] },
        ]),
      )
    })
  })

  describe('storeKeysWithValidation', () => {
    it('imports keys that are owners and creates delegates', async () => {
      const data: LegacyDataStructure = {
        keys: [
          {
            address: '0x2',
            name: 'Owner 1',
            key: Buffer.from('abcd', 'hex').toString('base64'),
          },
          {
            address: '0x4',
            name: 'Non-Owner',
            key: Buffer.from('efgh', 'hex').toString('base64'),
          },
        ],
      }

      const allOwners = new Set(['0x2', '0x3'])
      const mockUpdateNotImportedKeys = jest.fn()

      // Use runAllTimersAsync to handle the async delay properly
      const storeKeysPromise = storeKeysWithValidation(
        data,
        allOwners,
        mockDispatch,
        mockUpdateNotImportedKeys,
        mockCreateDelegate,
        mockProgressCallback,
      )

      await jest.runAllTimersAsync()
      await storeKeysPromise

      // Should import the owner key
      expect(storePrivateKey).toHaveBeenCalledWith('0x2', '0xabcd')
      expect(mockDispatch).toHaveBeenCalledWith(addSignerWithEffects({ value: '0x2', name: 'Owner 1' }))
      expect(mockCreateDelegate).toHaveBeenCalledWith('0xabcd', null)

      // Should not import the non-owner key
      expect(storePrivateKey).not.toHaveBeenCalledWith('0x4', '0xefgh')

      // Should update not imported keys
      expect(mockUpdateNotImportedKeys).toHaveBeenCalledWith([
        {
          address: '0x4',
          name: 'Non-Owner',
          reason: 'Not an owner of any imported safe',
        },
      ])

      expect(mockProgressCallback).toHaveBeenCalled()
    })
  })
})
