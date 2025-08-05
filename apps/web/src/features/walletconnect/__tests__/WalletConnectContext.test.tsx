import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { toBeHex } from 'ethers'
import { useContext } from 'react'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'

import { act, fireEvent, render, waitFor } from '@/tests/test-utils'
import { WalletConnectContext } from '../WalletConnectContext'
import WalletConnectWallet from '../services/WalletConnectWallet'
import { WalletConnectProvider } from '../WalletConnectContext'
import { safeInfoSlice } from '@/store/safeInfoSlice'
import { useAppDispatch } from '@/store'
import * as useSafeWalletProvider from '@/services/safe-wallet-provider/useSafeWalletProvider'

jest.mock('@reown/walletkit', () => jest.fn())

jest.mock('@/services/safe-wallet-provider/useSafeWalletProvider')

const TestComponent = () => {
  const { walletConnect, error } = useContext(WalletConnectContext)
  return (
    <>
      {walletConnect && <p>WalletConnect initialized</p>}
      {error && <p>{error.message}</p>}
    </>
  )
}

describe('WalletConnectProvider', () => {
  const extendedSafeInfo = {
    ...extendedSafeInfoBuilder().build(),
    address: {
      value: toBeHex('0x123', 20),
    },
    chainId: '5',
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('sets the walletConnect state', async () => {
    jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
    jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

    const { getByText } = render(
      <WalletConnectProvider>
        <TestComponent />
      </WalletConnectProvider>,
      {
        initialReduxState: {
          safeInfo: {
            loading: false,
            data: extendedSafeInfo,
          },
        },
      },
    )

    await waitFor(() => {
      expect(getByText('WalletConnect initialized')).toBeInTheDocument()
    })
  })

  it('sets the error state', async () => {
    jest
      .spyOn(WalletConnectWallet.prototype, 'init')
      .mockImplementation(() => Promise.reject(new Error('Test init failed')))
    jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

    const { getByText } = render(
      <WalletConnectProvider>
        <TestComponent />
      </WalletConnectProvider>,
      {
        initialReduxState: {
          safeInfo: {
            loading: false,
            data: extendedSafeInfo,
          },
        },
      },
    )

    await waitFor(() => {
      expect(getByText('Test init failed')).toBeInTheDocument()
    })
  })

  describe('updateSessions', () => {
    const extendedSafeInfo = {
      ...extendedSafeInfoBuilder().build(),
      address: {
        value: toBeHex('0x123', 20),
      },
      chainId: '5',
    }

    const getUpdateSafeInfoComponent = (safeInfo: SafeInfo) => {
      // eslint-disable-next-line react/display-name
      return () => {
        const dispatch = useAppDispatch()
        const updateSafeInfo = () => {
          dispatch(
            safeInfoSlice.actions.set({
              loading: false,
              data: { ...extendedSafeInfo, ...safeInfo },
            }),
          )
        }

        return <button onClick={() => updateSafeInfo()}>update</button>
      }
    }

    it('updates sessions when the chainId changes', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      const ChainUpdater = getUpdateSafeInfoComponent({
        address: { value: toBeHex('0x123', 20) },
        chainId: '1',
      } as SafeInfo)

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <ChainUpdater />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              data: extendedSafeInfo,
            },
          },
        },
      )

      await waitFor(() => {
        expect(getByText('WalletConnect initialized')).toBeInTheDocument()
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('5', toBeHex('0x123', 20))
      })

      fireEvent.click(getByText('update'))

      await waitFor(() => {
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('1', toBeHex('0x123', 20))
      })
    })

    it('updates sessions when the safeAddress changes', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      const AddressUpdater = getUpdateSafeInfoComponent({
        address: { value: toBeHex('0x456', 20) },
        chainId: '5',
      } as SafeInfo)

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <AddressUpdater />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              data: {
                ...extendedSafeInfo,
                address: {
                  value: toBeHex('0x123', 20),
                },
                chainId: '5',
              },
            },
          },
        },
      )

      await waitFor(() => {
        expect(getByText('WalletConnect initialized')).toBeInTheDocument()
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('5', toBeHex('0x123', 20))
      })

      fireEvent.click(getByText('update'))

      await waitFor(() => {
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('5', toBeHex('0x456', 20))
      })
    })

    it('sets the error state', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest
        .spyOn(WalletConnectWallet.prototype, 'updateSessions')
        .mockImplementation(() => Promise.reject(new Error('Test updateSessions failed')))

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              data: {
                ...extendedSafeInfo,
                address: {
                  value: toBeHex('0x123', 20),
                },
                chainId: '5',
              },
            },
          },
        },
      )

      await waitFor(() => {
        expect(getByText('Test updateSessions failed')).toBeInTheDocument()
      })
    })
  })

  describe('onRequest', () => {
    const extendedSafeInfo = {
      ...extendedSafeInfoBuilder().build(),
      address: {
        value: toBeHex('0x123', 20),
      },
      chainId: '5',
    }

    it('does not continue with the request if there is no matching topic', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [])

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')
      const sendSessionResponseSpy = jest.spyOn(WalletConnectWallet.prototype, 'sendSessionResponse')

      const mockRequest = jest.fn()
      jest.spyOn(useSafeWalletProvider, 'default').mockImplementation(
        () =>
          ({
            request: mockRequest,
          }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
      )

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              data: extendedSafeInfo,
            },
          },
        },
      )

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      onRequestHandler({
        id: 1,
        topic: 'topic',
        params: {
          request: {},
          chainId: 'eip155:5', // Goerli
        },
      } as unknown as WalletKitTypes.SessionRequest)

      await waitFor(() => {
        expect(sendSessionResponseSpy).toHaveBeenCalledWith('topic', {
          error: { code: 5100, message: 'Unsupported chains.' },
          id: 1,
          jsonrpc: '2.0',
        })
        expect(mockRequest).not.toHaveBeenCalled()
      })
    })

    it('does not continue with the request if there is no matching chainId', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest
        .spyOn(WalletConnectWallet.prototype, 'getActiveSessions')
        .mockImplementation(() => [
          { topic: 'topic', peer: { metadata: { url: 'https://test.com' } } } as unknown as SessionTypes.Struct,
        ])

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')
      const sendSessionResponseSpy = jest.spyOn(WalletConnectWallet.prototype, 'sendSessionResponse')

      const mockRequest = jest.fn()
      jest.spyOn(useSafeWalletProvider, 'default').mockImplementation(
        () =>
          ({
            request: mockRequest,
          }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
      )

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              data: extendedSafeInfo,
            },
          },
        },
      )

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      onRequestHandler({
        id: 1,
        topic: 'topic',
        params: {
          request: {},
          chainId: 'eip155:1', // Mainnet
        },
      } as unknown as WalletKitTypes.SessionRequest)

      await waitFor(() => {
        expect(sendSessionResponseSpy).toHaveBeenCalledWith('topic', {
          error: { code: 5100, message: 'Unsupported chains.' },
          id: 1,
          jsonrpc: '2.0',
        })
        expect(mockRequest).not.toHaveBeenCalled()
      })
    })

    it('passes the request onto the Safe Wallet Provider and sends the response to WalletConnect', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [
        {
          topic: 'topic',
          peer: {
            metadata: {
              name: 'name',
              description: 'description',
              url: 'https://apps-portal.safe.global/wallet-connect',
              icons: ['iconUrl'],
            },
          },
        } as unknown as SessionTypes.Struct,
      ])

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')
      const sendSessionResponseSpy = jest.spyOn(WalletConnectWallet.prototype, 'sendSessionResponse')

      const mockRequest = jest.fn().mockImplementation(() => Promise.resolve({}))
      jest.spyOn(useSafeWalletProvider, 'default').mockImplementation(
        () =>
          ({
            request: mockRequest,
          }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
      )

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              data: extendedSafeInfo,
            },
          },
        },
      )

      await act(() => Promise.resolve())

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      onRequestHandler({
        id: 1,
        topic: 'topic',
        params: {
          request: { method: 'fake', params: [] },
          chainId: 'eip155:5', // Goerli
        },
      } as unknown as WalletKitTypes.SessionRequest)

      expect(mockRequest).toHaveBeenCalledWith(
        1,
        { method: 'fake', params: [] },
        {
          name: 'name',
          description: 'description',
          url: 'https://apps-portal.safe.global/wallet-connect',
          iconUrl: 'iconUrl',
        },
      )

      await waitFor(() => {
        expect(sendSessionResponseSpy).toHaveBeenCalledWith('topic', {})
      })
    })

    it('sets the error state if there is an error requesting', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [
        {
          topic: 'topic',
          peer: {
            metadata: {
              name: 'name',
              description: 'description',
              url: 'https://apps-portal.safe.global/wallet-connect',
              icons: ['iconUrl'],
            },
          },
        } as unknown as SessionTypes.Struct,
      ])

      jest.spyOn(useSafeWalletProvider, 'default').mockImplementation(
        () =>
          ({
            request: () => Promise.reject(new Error('Test request failed')),
          }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
      )

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')
      const sendSessionResponseSpy = jest.spyOn(WalletConnectWallet.prototype, 'sendSessionResponse')

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              data: extendedSafeInfo,
            },
          },
        },
      )

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      onRequestHandler({
        id: 1,
        topic: 'topic',
        params: {
          request: {},
          chainId: 'eip155:5', // Goerli
        },
      } as unknown as WalletKitTypes.SessionRequest)

      expect(sendSessionResponseSpy).not.toHaveBeenCalled()

      await waitFor(() => {
        expect(getByText('Test request failed')).toBeInTheDocument()
      })
    })
  })
})
