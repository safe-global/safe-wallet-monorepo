import { Provider } from 'react-redux'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import * as router from 'next/router'

import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as notifications from './notifications'
import { act, renderHook, getAppName } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import useSafeWalletProvider, { useTxFlowApi } from './useSafeWalletProvider'
import { RpcErrorCode, SafeWalletProvider } from '.'
import type { RootState } from '@/store'
import { makeStore } from '@/store'
import * as messages from '@safe-global/utils/utils/safe-messages'
import { faker } from '@faker-js/faker'
import { Interface } from 'ethers'
import { getCreateCallDeployment } from '@safe-global/safe-deployments'
import * as chainHooks from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { useAllSafes, useGetHref } from '@/hooks/safes'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const createMockStore = <T,>(initialValue: T) => {
  let value: T = initialValue
  return {
    useStore: jest.fn(() => value),
    setStore: jest.fn((newValue: T) => {
      value = newValue
    }),
    getStore: jest.fn(() => value),
    _reset: (newValue: T) => {
      value = newValue
    },
  }
}

const mockWcPopupStore = createMockStore<boolean>(false)

const mockWcChainSwitchStore = createMockStore<any>(undefined)
const mockWalletConnectInstance = {
  init: jest.fn(),
  updateSessions: jest.fn().mockResolvedValue(undefined),
}

// Mock useLoadFeature to return the WalletConnect feature (flat structure)
jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(() => ({
    wcPopupStore: mockWcPopupStore,
    wcChainSwitchStore: mockWcChainSwitchStore,
    walletConnectInstance: mockWalletConnectInstance,
  })),
  createFeatureHandle: jest.fn((name: string) => ({
    name,
    useIsEnabled: () => true,
    load: jest.fn(),
  })),
}))

// Mock the feature handle export (not used directly, but imported)
jest.mock('@/features/walletconnect', () => ({
  WalletConnectFeature: {
    name: 'walletconnect',
    useIsEnabled: () => true,
    load: jest.fn(),
  },
}))

const updateSessionsMock = mockWalletConnectInstance.updateSessions as jest.MockedFunction<
  typeof mockWalletConnectInstance.updateSessions
>

updateSessionsMock.mockResolvedValue(undefined)

jest.mock('@/hooks/safes', () => ({
  __esModule: true,
  useAllSafes: jest.fn(),
  useGetHref: jest.fn(),
}))

const mockedUseAllSafes = useAllSafes as jest.MockedFunction<typeof useAllSafes>
const mockedUseGetHref = useGetHref as jest.MockedFunction<typeof useGetHref>

const appInfo = {
  id: 1,
  name: 'test',
  description: 'test',
  iconUrl: 'test',
  url: 'test',
}

jest.mock('./notifications', () => {
  return {
    ...jest.requireActual('./notifications'),
    showNotification: jest.fn(),
  }
})

describe('useSafeWalletProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    updateSessionsMock.mockClear()

    jest.spyOn(chainHooks, 'default').mockImplementation(() => ({
      configs: [
        chainBuilder().with({ chainId: '1', shortName: 'eth', chainName: 'Ethereum' }).build(),
        chainBuilder().with({ chainId: '5', shortName: 'gor', chainName: 'Goerli' }).build(),
      ],
      error: undefined,
      loading: false,
    }))

    jest.spyOn(chainHooks, 'useCurrentChain').mockImplementation(() => {
      return chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build()
    })

    mockedUseAllSafes.mockReturnValue([])
    mockedUseGetHref.mockImplementation(() => (chain, address: string) => ({
      pathname: '/',
      query: { safe: `${chain.shortName}:${address}` },
    }))

    mockWcPopupStore._reset(false)
    mockWcChainSwitchStore._reset(undefined)
  })

  describe('useSafeWalletProvider', () => {
    it('should return a provider', () => {
      const { result } = renderHook(() => useSafeWalletProvider(), {
        initialReduxState: {
          safeInfo: {
            loading: false,
            loaded: true,
            error: undefined,
            data: {
              chainId: '1',
              address: {
                value: '0x1234567890000000000000000000000000000000',
              },
              deployed: true,
              version: '1.3.0',
            } as unknown as ExtendedSafeInfo,
          },
        },
      })

      expect(result.current instanceof SafeWalletProvider).toBe(true)
    })
  })

  describe('_useTxFlowApi', () => {
    it('should return a provider', () => {
      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'))

      expect(result.current?.signMessage).toBeDefined()
      expect(result.current?.signTypedMessage).toBeDefined()
      expect(result.current?.send).toBeDefined()
      expect(result.current?.getBySafeTxHash).toBeDefined()
      expect(result.current?.switchChain).toBeDefined()
      expect(result.current?.proxy).toBeDefined()
      expect(result.current?.getCreateCallTransaction).toBeDefined()
    })

    it('should open signing window for off-chain messages', () => {
      jest.spyOn(router, 'useRouter').mockReturnValue({} as unknown as router.NextRouter)
      jest.spyOn(messages, 'isOffchainEIP1271Supported').mockReturnValue(true)
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification')

      const mockSetTxFlow = jest.fn()

      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'), {
        // TODO: Improve render/renderHook to allow custom wrappers within the "defaults"
        wrapper: ({ children }) => (
          <Provider store={makeStore(undefined, { skipBroadcast: true })}>
            <TxModalContext.Provider value={{ setTxFlow: mockSetTxFlow } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const resp = result?.current?.signMessage('message', appInfo)

      const appName = getAppName()

      expect(showNotificationSpy).toHaveBeenCalledWith('Signature request', {
        body: `test wants you to sign a message. Open the ${appName} to continue.`,
      })

      expect(mockSetTxFlow.mock.calls[0][0].props).toStrictEqual({
        logoUri: appInfo.iconUrl,
        name: appInfo.name,
        message: 'message',
        requestId: expect.any(String),
        origin: appInfo.url,
      })

      expect(resp).toBeInstanceOf(Promise)
    })

    it('should open a signing window for on-chain messages', async () => {
      jest.spyOn(router, 'useRouter').mockReturnValue({} as unknown as router.NextRouter)
      jest.spyOn(messages, 'isOffchainEIP1271Supported').mockReturnValue(true)
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification')

      const mockSetTxFlow = jest.fn()

      const testStore = makeStore(
        {
          settings: {
            signing: {
              onChainSigning: false,
              blindSigning: false,
            },
          },
        } as Partial<RootState>,
        { skipBroadcast: true },
      )

      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'), {
        // TODO: Improve render/renderHook to allow custom wrappers within the "defaults"
        wrapper: ({ children }) => (
          <Provider store={testStore}>
            <TxModalContext.Provider value={{ setTxFlow: mockSetTxFlow } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      act(() => {
        // Set Safe settings to on-chain signing
        const resp1 = result.current?.setSafeSettings({ offChainSigning: false })

        expect(resp1).toStrictEqual({ offChainSigning: false })
      })

      const resp2 = result?.current?.signMessage('message', appInfo)

      const appName = getAppName()

      expect(showNotificationSpy).toHaveBeenCalledWith('Signature request', {
        body: `test wants you to sign a message. Open the ${appName} to continue.`,
      })

      // SignMessageOnChainFlow props
      expect(mockSetTxFlow.mock.calls[0][0].props).toStrictEqual({
        props: {
          requestId: expect.any(String),
          message: 'message',
          method: 'signMessage',
        },
      })

      expect(resp2).toBeInstanceOf(Promise)
    })

    it('should open signing window for off-chain typed messages', () => {
      jest.spyOn(router, 'useRouter').mockReturnValue({} as unknown as router.NextRouter)
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification')

      const mockSetTxFlow = jest.fn()

      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'), {
        // TODO: Improve render/renderHook to allow custom wrappers within the "defaults"
        wrapper: ({ children }) => (
          <Provider store={makeStore(undefined, { skipBroadcast: true })}>
            <TxModalContext.Provider value={{ setTxFlow: mockSetTxFlow } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const typedMessage = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'account', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        domain: {
          name: 'EIP-1271 Example',
          version: '1.0',
          chainId: 5,
          verifyingContract: '0x0000000000000000000000000000000000000000',
        },
        message: {
          from: {
            name: 'Alice',
            account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          },
          to: {
            name: 'Bob',
            account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          },
          contents: 'Hello EIP-1271!',
        },
      }

      const resp = result?.current?.signTypedMessage(typedMessage, appInfo)

      const appName = getAppName()

      expect(showNotificationSpy).toHaveBeenCalledWith('Signature request', {
        body: `test wants you to sign a message. Open the ${appName} to continue.`,
      })

      expect(mockSetTxFlow.mock.calls[0][0].props).toStrictEqual({
        logoUri: appInfo.iconUrl,
        name: appInfo.name,
        message: typedMessage,
        requestId: expect.any(String),
        origin: appInfo.url,
      })

      expect(resp).toBeInstanceOf(Promise)
    })

    it('should should send (batched) transactions', () => {
      jest.spyOn(router, 'useRouter').mockReturnValue({} as unknown as router.NextRouter)
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification')

      const mockSetTxFlow = jest.fn()

      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'), {
        // TODO: Improve render/renderHook to allow custom wrappers within the "defaults"
        wrapper: ({ children }) => (
          <Provider store={makeStore(undefined, { skipBroadcast: true })}>
            <TxModalContext.Provider value={{ setTxFlow: mockSetTxFlow } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const resp = result.current?.send(
        {
          txs: [
            {
              to: '0x1234567890000000000000000000000000000000',
              value: '0',
              data: '0x',
            },
            // Batch
            {
              to: '0x1234567890000000000000000000000000000000',
              value: '0',
              data: '0x',
            },
          ],
          params: { safeTxGas: 0 },
        },
        appInfo,
      )

      const appName = getAppName()

      expect(showNotificationSpy).toHaveBeenCalledWith('Transaction request', {
        body: `test wants to submit a transaction. Open the ${appName} to continue.`,
      })

      expect(mockSetTxFlow.mock.calls[0][0].props).toStrictEqual({
        data: {
          appId: undefined,
          app: appInfo,
          requestId: expect.any(String),
          txs: [
            {
              to: '0x1234567890000000000000000000000000000000',
              value: '0',
              data: '0x',
            },
            // Batch
            {
              to: '0x1234567890000000000000000000000000000000',
              value: '0',
              data: '0x',
            },
          ],
          params: { safeTxGas: 0 },
        },
        onSubmit: expect.any(Function),
      })

      expect(resp).toBeInstanceOf(Promise)
    })

    it('should get tx by safe tx hash', async () => {
      const mockTxDetails: TransactionDetails = {
        txInfo: {
          type: 'Custom',
          to: {
            value: '0x123',
            name: 'Test',
            logoUri: null,
          },
          dataSize: '100',
          value: null,
          isCancellation: false,
          methodName: 'test',
        },
        safeAddress: '0x456',
        txId: '0x123456789000',
        txStatus: 'AWAITING_CONFIRMATIONS',
      }

      jest.spyOn(require('@/utils/transactions'), 'getTransactionDetails').mockResolvedValue(mockTxDetails)

      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'))

      const resp = await result.current?.getBySafeTxHash('0x123456789000')

      expect(resp).toEqual(mockTxDetails)
    })

    it('should request a Safe selection when switching chains', async () => {
      const mockPush = jest.fn().mockResolvedValue(true)
      const safeItem = {
        chainId: '5',
        address: '0x1234567890000000000000000000000000000000',
        isPinned: false,
        isReadOnly: false,
        lastVisited: 0,
        name: 'Test Safe',
      }

      mockedUseAllSafes.mockReturnValue([safeItem])

      jest.spyOn(router, 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/',
        query: {},
      } as unknown as router.NextRouter)

      const store = makeStore({} as Partial<RootState>, { skipBroadcast: true })

      mockWcPopupStore.setStore(true)

      const { result } = renderHook(() => useTxFlowApi('1', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      expect(promise).toBeInstanceOf(Promise)

      const request = mockWcChainSwitchStore.getStore()
      expect(request).toBeDefined()
      expect(request?.safes).toEqual([safeItem])
      expect(request?.chain.chainId).toBe('5')

      await act(async () => {
        if (!request) {
          throw new Error('Expected WalletConnect chain switch request')
        }

        await request.onSelectSafe(safeItem)
      })

      await expect(promise).resolves.toBeNull()
      expect(mockWcChainSwitchStore.getStore()).toBeUndefined()
      expect(mockWcPopupStore.getStore()).toBe(true)
      expect(updateSessionsMock).toHaveBeenCalledWith('5', safeItem.address)
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/',
        query: { safe: 'gor:0x1234567890000000000000000000000000000000' },
      })
    })

    it('should automatically switch to a Safe with the same address on the target chain', async () => {
      const mockPush = jest.fn().mockResolvedValue(true)
      const currentSafeAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const safeItem = {
        chainId: '5',
        address: currentSafeAddress,
        isPinned: false,
        isReadOnly: false,
        lastVisited: 0,
        name: 'Matching Safe',
      }

      mockedUseAllSafes.mockReturnValue([safeItem])

      jest.spyOn(router, 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/',
        query: {},
      } as unknown as router.NextRouter)

      const store = makeStore({} as Partial<RootState>, { skipBroadcast: true })

      const { result } = renderHook(() => useTxFlowApi('1', currentSafeAddress), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      expect(promise).toBeInstanceOf(Promise)
      expect(mockWcChainSwitchStore.getStore()).toBeUndefined()
      expect(mockWcPopupStore.getStore()).toBe(false)

      await act(async () => {
        await expect(promise).resolves.toBeNull()
      })

      expect(updateSessionsMock).toHaveBeenCalledWith('5', currentSafeAddress)
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/',
        query: { safe: 'gor:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
      })
    })

    it('should reject switching chains when the user cancels the modal', async () => {
      const mockPush = jest.fn().mockResolvedValue(true)
      const safeItem = {
        chainId: '5',
        address: '0x1234567890000000000000000000000000000000',
        isPinned: false,
        isReadOnly: false,
        lastVisited: 0,
        name: 'Test Safe',
      }

      mockedUseAllSafes.mockReturnValue([safeItem])

      jest.spyOn(router, 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/',
        query: {},
      } as unknown as router.NextRouter)

      const store = makeStore({} as Partial<RootState>, { skipBroadcast: true })

      const { result } = renderHook(() => useTxFlowApi('1', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      expect(promise).toBeInstanceOf(Promise)
      expect(mockWcPopupStore.getStore()).toBe(true)

      const request = mockWcChainSwitchStore.getStore()
      expect(request).toBeDefined()
      expect(request?.chain.chainId).toBe('5')
      expect(request?.safes).toEqual([safeItem])

      let error: unknown
      await act(async () => {
        request?.onCancel()
        error = await (promise as Promise<never>).catch((err) => err)
      })

      expect(error).toEqual({
        code: RpcErrorCode.USER_REJECTED,
        message: 'User rejected chain switch',
      })
      expect(mockWcChainSwitchStore.getStore()).toBeUndefined()
      expect(mockWcPopupStore.getStore()).toBe(false)
      expect(updateSessionsMock).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should ignore cancellation once the chain switch promise is settled', async () => {
      const mockPush = jest.fn().mockResolvedValue(true)

      const safeItem = {
        chainId: '5',
        address: '0x1234567890000000000000000000000000000000',
        isPinned: false,
        isReadOnly: false,
        lastVisited: 0,
        name: 'Test Safe',
      }

      mockedUseAllSafes.mockReturnValue([safeItem])

      jest.spyOn(router, 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/',
        query: {},
      } as unknown as router.NextRouter)

      const store = makeStore({} as Partial<RootState>, { skipBroadcast: true })

      const { result } = renderHook(() => useTxFlowApi('1', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      const request = mockWcChainSwitchStore.getStore()
      expect(request).toBeDefined()

      await act(async () => {
        if (!request) {
          throw new Error('Expected WalletConnect chain switch request')
        }

        await request.onSelectSafe(safeItem)
      })

      await expect(promise).resolves.toBeNull()
      expect(mockWcChainSwitchStore.getStore()).toBeUndefined()
      expect(mockWcPopupStore.getStore()).toBe(false)

      expect(updateSessionsMock).toHaveBeenCalledWith('5', safeItem.address)

      request?.onCancel()

      expect(mockWcChainSwitchStore.getStore()).toBeUndefined()
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/',
        query: { safe: 'gor:0x1234567890000000000000000000000000000000' },
      })
    })

    it('should handle consecutive chain switch requests on the same chain', async () => {
      const mockPush = jest.fn().mockResolvedValue(true)

      const safes = [
        {
          chainId: '5',
          address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          name: 'Safe Alpha',
        },
        {
          chainId: '5',
          address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          name: 'Safe Beta',
        },
      ]

      mockedUseAllSafes.mockReturnValue(safes)

      jest.spyOn(router, 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/',
        query: {},
      } as unknown as router.NextRouter)

      const store = makeStore(
        {
          chains: {
            data: [
              {
                chainId: '5',
                shortName: 'gor',
                chainName: 'Goerli',
                zk: false,
                beaconChainExplorerUriTemplate: {},
              } as any,
            ],
            loading: false,
            loaded: true,
            error: undefined,
          },
        } as Partial<RootState>,
        { skipBroadcast: true },
      )

      const { result } = renderHook(() => useTxFlowApi('5', safes[0].address), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const firstPromise = result.current?.switchChain('0x5', appInfo)
      expect(firstPromise).toBeInstanceOf(Promise)

      const firstRequest = mockWcChainSwitchStore.getStore()
      expect(firstRequest?.safes).toEqual(safes)

      await act(async () => {
        if (!firstRequest) {
          throw new Error('Expected WalletConnect chain switch request')
        }

        await firstRequest.onSelectSafe(safes[1])
      })

      await expect(firstPromise).resolves.toBeNull()
      expect(updateSessionsMock).toHaveBeenCalledWith('5', safes[1].address)
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/',
        query: { safe: 'gor:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
      })

      updateSessionsMock.mockClear()
      mockPush.mockClear()

      const secondPromise = result.current?.switchChain('0x5', appInfo)
      expect(secondPromise).toBeInstanceOf(Promise)

      const secondRequest = mockWcChainSwitchStore.getStore()
      expect(secondRequest?.safes).toEqual(safes)

      await act(async () => {
        if (!secondRequest) {
          throw new Error('Expected WalletConnect chain switch request')
        }

        await secondRequest.onSelectSafe(safes[0])
      })

      await expect(secondPromise).resolves.toBeNull()
      expect(updateSessionsMock).toHaveBeenCalledWith('5', safes[0].address)
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/',
        query: { safe: 'gor:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
      })
    })

    it('should proxy RPC calls', async () => {
      const mockSend = jest.fn(() => Promise.resolve({ result: '0x' }))

      jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockImplementation(
        () =>
          ({
            send: mockSend,
          }) as any,
      )

      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'))

      result.current?.proxy('eth_chainId', [])

      expect(mockSend).toHaveBeenCalledWith('eth_chainId', [])
    })
  })

  it('should show a tx by hash', () => {
    const routerPush = jest.fn()

    jest.spyOn(router, 'useRouter').mockReturnValue({
      push: routerPush,
      query: {
        safe: '0x1234567890000000000000000000000000000000',
      },
    } as unknown as router.NextRouter)

    const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'))

    result.current?.showTxStatus('0x123')

    expect(routerPush).toHaveBeenCalledWith({
      pathname: '/transactions/tx',
      query: {
        safe: '0x1234567890000000000000000000000000000000',
        id: '0x123',
      },
    })
  })

  it('should create CreateCall lib transactions', () => {
    const createCallDeployment = getCreateCallDeployment({ version: '1.3.0', network: '1' })
    const createCallInterface = new Interface(['function performCreate(uint256,bytes)'])
    const safeAddress = faker.finance.ethereumAddress()
    const { result } = renderHook(() => useTxFlowApi('1', safeAddress), {
      initialReduxState: {
        safeInfo: {
          loading: false,
          loaded: true,
          error: undefined,
          data: {
            chainId: '1',
            address: {
              value: safeAddress,
            },
            deployed: true,
            version: '1.3.0',
          } as unknown as ExtendedSafeInfo,
        },
      },
    })

    const tx = result.current?.getCreateCallTransaction('0x1234')

    expect(tx).toEqual({
      to: createCallDeployment?.networkAddresses['1'],
      value: '0',
      data: createCallInterface.encodeFunctionData('performCreate', [0, '0x1234']),
    })
  })
})
