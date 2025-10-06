import { Provider } from 'react-redux'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import * as gateway from '@safe-global/safe-gateway-typescript-sdk'
import * as router from 'next/router'

import * as web3 from '@/hooks/wallets/web3'
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
import useAllSafes from '@/features/myAccounts/hooks/useAllSafes'
import { useGetHref } from '@/features/myAccounts/hooks/useGetHref'
import { wcPopupStore } from '@/features/walletconnect/components'
import { wcChainSwitchStore } from '@/features/walletconnect/components/WcChainSwitchModal/store'
import walletConnectInstance from '@/features/walletconnect/services/walletConnectInstance'

jest.mock('@/features/walletconnect/services/walletConnectInstance', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    updateSessions: jest.fn(),
  },
}))

const updateSessionsMock = walletConnectInstance.updateSessions as jest.MockedFunction<
  (typeof walletConnectInstance)['updateSessions']
>

updateSessionsMock.mockResolvedValue()

jest.mock('@/features/myAccounts/hooks/useAllSafes', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/myAccounts/hooks/useGetHref', () => ({
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

    jest.spyOn(chainHooks, 'useCurrentChain').mockImplementation(() => {
      return chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build()
    })

    mockedUseAllSafes.mockReturnValue([])
    mockedUseGetHref.mockImplementation(() => (chain, address: string) => ({
      pathname: '/',
      query: { safe: `${chain.shortName}:${address}` },
    }))

    wcPopupStore.setStore(false)
    wcChainSwitchStore.setStore(undefined)
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
      jest.spyOn(gateway as any, 'getTransactionDetails').mockImplementation(() => ({
        hash: '0x123',
      }))

      const { result } = renderHook(() => useTxFlowApi('1', '0x1234567890000000000000000000000000000000'))

      const resp = await result.current?.getBySafeTxHash('0x123456789000')

      expect(gateway.getTransactionDetails).toHaveBeenCalledWith('1', '0x123456789000')
      expect(resp).toEqual({ hash: '0x123' })
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

      const store = makeStore(
        {
          chains: {
            data: [
              {
                chainId: '1',
                shortName: 'eth',
                chainName: 'Ethereum',
                zk: false,
                beaconChainExplorerUriTemplate: {},
              } as any,
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

      wcPopupStore.setStore(true)

      const { result } = renderHook(() => useTxFlowApi('1', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      expect(promise).toBeInstanceOf(Promise)

      const request = wcChainSwitchStore.getStore()
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
      expect(wcChainSwitchStore.getStore()).toBeUndefined()
      expect(wcPopupStore.getStore()).toBe(true)
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

      const store = makeStore(
        {
          chains: {
            data: [
              {
                chainId: '1',
                shortName: 'eth',
                chainName: 'Ethereum',
                zk: false,
                beaconChainExplorerUriTemplate: {},
              } as any,
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

      const { result } = renderHook(() => useTxFlowApi('1', currentSafeAddress), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      expect(promise).toBeInstanceOf(Promise)
      expect(wcChainSwitchStore.getStore()).toBeUndefined()
      expect(wcPopupStore.getStore()).toBe(false)

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

      const store = makeStore(
        {
          chains: {
            data: [
              {
                chainId: '1',
                shortName: 'eth',
                chainName: 'Ethereum',
                zk: false,
                beaconChainExplorerUriTemplate: {},
              } as any,
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

      const { result } = renderHook(() => useTxFlowApi('1', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      expect(promise).toBeInstanceOf(Promise)
      expect(wcPopupStore.getStore()).toBe(true)

      const request = wcChainSwitchStore.getStore()
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
      expect(wcChainSwitchStore.getStore()).toBeUndefined()
      expect(wcPopupStore.getStore()).toBe(false)
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

      const store = makeStore(
        {
          chains: {
            data: [
              {
                chainId: '1',
                shortName: 'eth',
                chainName: 'Ethereum',
                zk: false,
                beaconChainExplorerUriTemplate: {},
              } as any,
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

      const { result } = renderHook(() => useTxFlowApi('1', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <TxModalContext.Provider value={{ setTxFlow: jest.fn() } as any}>{children}</TxModalContext.Provider>
          </Provider>
        ),
      })

      const promise = result.current?.switchChain('0x5', appInfo)

      const request = wcChainSwitchStore.getStore()
      expect(request).toBeDefined()

      await act(async () => {
        if (!request) {
          throw new Error('Expected WalletConnect chain switch request')
        }

        await request.onSelectSafe(safeItem)
      })

      await expect(promise).resolves.toBeNull()
      expect(wcChainSwitchStore.getStore()).toBeUndefined()
      expect(wcPopupStore.getStore()).toBe(false)

      expect(updateSessionsMock).toHaveBeenCalledWith('5', safeItem.address)

      request?.onCancel()

      expect(wcChainSwitchStore.getStore()).toBeUndefined()
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

      const firstRequest = wcChainSwitchStore.getStore()
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

      const secondRequest = wcChainSwitchStore.getStore()
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

      jest.spyOn(web3 as any, 'useWeb3ReadOnly').mockImplementation(() => ({
        send: mockSend,
      }))

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
