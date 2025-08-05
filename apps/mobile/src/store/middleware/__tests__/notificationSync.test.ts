import notificationSyncMiddleware from '../notificationSync'
import { addressBookSlice } from '@/src/store/addressBookSlice'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { configureStore, Action } from '@reduxjs/toolkit'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'

jest.mock('@/src/services/notifications/store-sync/sync', () => ({
  syncNotificationExtensionData: jest.fn(),
}))

import { syncNotificationExtensionData } from '@/src/services/notifications/store-sync/sync'

const mockSyncNotificationExtensionData = syncNotificationExtensionData as jest.MockedFunction<
  typeof syncNotificationExtensionData
>

// Define test gateway URL
const TEST_GATEWAY_URL = 'https://safe-client.staging.5afe.dev'

describe('notificationSyncMiddleware', () => {
  let store: { getState: jest.Mock; dispatch: jest.Mock }
  let next: jest.Mock
  let middleware: (action: unknown) => unknown

  beforeAll(() => {
    // Set up the base URL like the real app does
    setBaseUrl(TEST_GATEWAY_URL)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    store = {
      getState: jest.fn(),
      dispatch: jest.fn(),
    }
    next = jest.fn((action) => action)
    middleware = notificationSyncMiddleware(store)(next)
  })

  describe('addressBook actions', () => {
    it('should sync when addContact action is dispatched', () => {
      const action = addressBookSlice.actions.addContact({
        value: '0x123',
        name: 'Test Contact',
        chainIds: ['1'],
      })

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(1)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledWith(store)
    })

    it('should sync when removeContact action is dispatched', () => {
      const action = addressBookSlice.actions.removeContact('0x123')

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(1)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledWith(store)
    })

    it('should sync when updateContact action is dispatched', () => {
      const action = addressBookSlice.actions.updateContact({
        value: '0x123',
        name: 'Updated Contact',
        chainIds: ['1'],
      })

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(1)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledWith(store)
    })

    it('should NOT sync when selectContact action is dispatched', () => {
      const action = addressBookSlice.actions.selectContact('0x123')

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).not.toHaveBeenCalled()
    })

    it('should sync when addContacts action is dispatched', () => {
      const action = addressBookSlice.actions.addContacts([
        { value: '0x123', name: 'Contact 1', chainIds: ['1'] },
        { value: '0x456', name: 'Contact 2', chainIds: ['1'] },
      ])

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(1)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledWith(store)
    })

    it('should sync when upsertContact action is dispatched', () => {
      const action = addressBookSlice.actions.upsertContact({
        value: '0x123',
        name: 'Upserted Contact',
        chainIds: ['1'],
      })

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(1)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledWith(store)
    })
  })

  describe('chain configuration actions', () => {
    let testStore: ReturnType<typeof configureStore>

    beforeEach(() => {
      // Ensure base URL is set for RTK Query
      setBaseUrl(TEST_GATEWAY_URL)

      // Create a test store with the middleware and RTK Query
      testStore = configureStore({
        reducer: {
          addressBook: addressBookSlice.reducer,
          [apiSliceWithChainsConfig.reducerPath]: apiSliceWithChainsConfig.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(apiSliceWithChainsConfig.middleware).concat(notificationSyncMiddleware),
      })
    })

    it('should sync when real getChainsConfig fulfilled action is dispatched', async () => {
      // Mock the chains endpoint to return test data
      server.use(
        http.get(`${TEST_GATEWAY_URL}/v1/chains`, () => {
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                chainId: '1',
                chainName: 'Ethereum',
                shortName: 'eth',
                l2: false,
                description: 'Ethereum Mainnet',
                chainLogoUri: null,
                rpcUri: { authentication: 'API_KEY_PATH', value: 'https://mainnet.infura.io' },
                safeAppsRpcUri: { authentication: 'API_KEY_PATH', value: 'https://mainnet.infura.io' },
                publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.ankr.com/eth' },
                blockExplorerUriTemplate: {
                  address: 'https://etherscan.io/address/{{address}}',
                  txHash: 'https://etherscan.io/tx/{{txHash}}',
                  api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
                },
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                  logoUri: 'https://safe-transaction-assets.staging.5afe.dev/chains/1/currency_logo.png',
                },
                transactionService: 'https://safe-transaction-mainnet.staging.5afe.dev',
                vpcTransactionService: 'https://safe-transaction-mainnet.staging.5afe.dev',
                theme: { textColor: '#001428', backgroundColor: '#DDDDDD' },
                ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
                gasPrice: [
                  {
                    type: 'ORACLE',
                    uri: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken',
                    gasParameter: 'SafeGasPrice',
                    gweiFactor: '1000000000.000000000',
                  },
                ],
                disabledWallets: [],
                features: [],
              },
            ],
          })
        }),
      )

      // Dispatch the real RTK Query thunk
      await testStore.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate() as unknown as Action)

      // The middleware should have been triggered by the fulfilled action
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(1)
    })

    it('should NOT sync when getChainsConfig fails', async () => {
      // Mock the chains endpoint to return an error
      server.use(
        http.get(`${TEST_GATEWAY_URL}/v1/chains`, () => {
          return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        }),
      )

      // Dispatch the real RTK Query thunk
      await testStore.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate() as unknown as Action)

      // The middleware should NOT have been triggered by the rejected action
      expect(mockSyncNotificationExtensionData).not.toHaveBeenCalled()
    })
  })

  describe('unrelated actions', () => {
    it('should NOT sync for txHistory actions', () => {
      const action = {
        type: 'txHistory/addTransaction',
        payload: { txId: '0x456' },
      }

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).not.toHaveBeenCalled()
    })

    it('should NOT sync for activeSafe actions', () => {
      const action = {
        type: 'activeSafe/setActiveSafe',
        payload: { address: '0x789', chainId: '1' },
      }

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).not.toHaveBeenCalled()
    })

    it('should NOT sync for signers actions', () => {
      const action = {
        type: 'signers/addSigner',
        payload: { address: '0xabc' },
      }

      middleware(action)

      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).not.toHaveBeenCalled()
    })
  })

  describe('middleware flow', () => {
    it('should always call next() regardless of sync decision', () => {
      const relevantAction = { type: 'addressBook/addContact' }
      const irrelevantAction = { type: 'unrelated/action' }

      middleware(relevantAction)
      middleware(irrelevantAction)

      expect(next).toHaveBeenCalledTimes(2)
      expect(next).toHaveBeenNthCalledWith(1, relevantAction)
      expect(next).toHaveBeenNthCalledWith(2, irrelevantAction)
    })

    it('should return the result from next()', () => {
      const action = { type: 'test/action' }
      const expectedResult = { ...action, processed: true }
      next.mockReturnValue(expectedResult)

      const result = middleware(action)

      expect(result).toBe(expectedResult)
    })

    it('should handle actions without type property gracefully', () => {
      const action = { payload: 'test' }

      expect(() => middleware(action)).not.toThrow()
      expect(next).toHaveBeenCalledWith(action)
      expect(mockSyncNotificationExtensionData).not.toHaveBeenCalled()
    })
  })

  describe('performance considerations', () => {
    it('should only call syncNotificationExtensionData once per relevant action', () => {
      const action = addressBookSlice.actions.addContact({ value: '0x123', name: 'Contact', chainIds: ['1'] })

      middleware(action)

      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(1)
      expect(mockSyncNotificationExtensionData).toHaveBeenCalledWith(store)
    })

    it('should process multiple relevant actions independently', async () => {
      // Mock a successful chains response for this test
      server.use(
        http.get(`${TEST_GATEWAY_URL}/v1/chains`, () => {
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [{ chainId: '1', chainName: 'Ethereum', nativeCurrency: { symbol: 'ETH', decimals: 18 } }],
          })
        }),
      )

      // Ensure base URL is set
      setBaseUrl(TEST_GATEWAY_URL)

      // Create a test store
      const testStore = configureStore({
        reducer: {
          addressBook: addressBookSlice.reducer,
          [apiSliceWithChainsConfig.reducerPath]: apiSliceWithChainsConfig.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(apiSliceWithChainsConfig.middleware).concat(notificationSyncMiddleware),
      })

      // Dispatch addressBook actions (these will be processed by our original middleware)
      testStore.dispatch(addressBookSlice.actions.addContact({ value: '0x123', name: 'Contact', chainIds: ['1'] }))
      testStore.dispatch(addressBookSlice.actions.removeContact('0x456'))

      // Dispatch RTK Query action
      await testStore.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate() as unknown as Action)

      expect(mockSyncNotificationExtensionData).toHaveBeenCalledTimes(3)
    })
  })
})
