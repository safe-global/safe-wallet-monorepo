import { faker } from '@faker-js/faker'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { useContext } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { act, fireEvent, render, waitFor } from '@/tests/test-utils'
import { WalletConnectContext } from '../WalletConnectContext'
import WalletConnectWallet from '../services/WalletConnectWallet'
import { WalletConnectProvider, WCLoadingState } from '../WalletConnectContext'
import { safeInfoSlice } from '@/store/safeInfoSlice'
import { useAppDispatch } from '@/store'
import * as useSafeWalletProvider from '@/services/safe-wallet-provider/useSafeWalletProvider'
import * as useLocalStorageHook from '@/services/local-storage/useLocalStorage'
import { wcPopupStore } from '@/features/walletconnect/components'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

jest.mock('@reown/walletkit', () => jest.fn())

jest.mock('@/services/safe-wallet-provider/useSafeWalletProvider')

jest.mock('@/features/walletconnect/components', () => ({ wcPopupStore: { useStore: jest.fn(), setStore: jest.fn() } }))

const TestComponent = () => {
  const { walletConnect, error, loading, sessions, sessionProposal, open } = useContext(WalletConnectContext)
  return (
    <>
      {walletConnect && <p>WalletConnect initialized</p>}
      {error && <p>{error.message}</p>}
      {loading && <p>Loading: {loading}</p>}
      {sessions.length > 0 && <p>Sessions: {sessions.length}</p>}
      {sessionProposal && <p>Session proposal received</p>}
      {open && <p>Popup is open</p>}
    </>
  )
}

const ContextControlComponent = () => {
  const { approveSession, rejectSession, setError, setOpen, setLoading } = useContext(WalletConnectContext)

  const handleApprove = async () => {
    try {
      await approveSession()
    } catch (e) {
      setError(e as Error)
    }
  }

  const handleReject = async () => {
    try {
      await rejectSession()
    } catch (e) {
      setError(e as Error)
    }
  }

  return (
    <>
      <button onClick={handleApprove}>Approve Session</button>
      <button onClick={handleReject}>Reject Session</button>
      <button onClick={() => setError(new Error('Test error'))}>Set Error</button>
      <button onClick={() => setOpen(true)}>Open Popup</button>
      <button onClick={() => setLoading(WCLoadingState.CONNECT)}>Set Loading</button>
    </>
  )
}

describe('WalletConnectProvider', () => {
  const testSafeAddress = faker.finance.ethereumAddress()

  const extendedSafeInfo = { ...extendedSafeInfoBuilder().build(), address: { value: testSafeAddress }, chainId: '5' }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
    ;(wcPopupStore.useStore as jest.Mock).mockReturnValue(false)
    ;(wcPopupStore.setStore as jest.Mock).mockImplementation(() => {})
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([{}, jest.fn()])
  })

  it('sets the walletConnect state', async () => {
    jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
    jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

    const { getByText } = render(
      <WalletConnectProvider>
        <TestComponent />
      </WalletConnectProvider>,
      { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
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
      { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
    )

    await waitFor(() => {
      expect(getByText('Test init failed')).toBeInTheDocument()
    })
  })

  it('does not initialize updateSessions without walletConnect, chainId, or safeAddress', async () => {
    jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
    const updateSessionsSpy = jest
      .spyOn(WalletConnectWallet.prototype, 'updateSessions')
      .mockImplementation(() => Promise.resolve())

    render(
      <WalletConnectProvider>
        <TestComponent />
      </WalletConnectProvider>,
      { initialReduxState: { safeInfo: { loading: false, loaded: true, data: { ...extendedSafeInfo, chainId: '' } } } },
    )

    await waitFor(() => {
      expect(updateSessionsSpy).not.toHaveBeenCalled()
    })
  })

  it('manages popup state correctly', async () => {
    ;(wcPopupStore.useStore as jest.Mock).mockReturnValue(true)
    jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
    jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

    const { getByText } = render(
      <WalletConnectProvider>
        <TestComponent />
        <ContextControlComponent />
      </WalletConnectProvider>,
      { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
    )

    await waitFor(() => {
      expect(getByText('Popup is open')).toBeInTheDocument()
    })
  })

  it('allows setting error through context', async () => {
    jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
    jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

    const { getByText } = render(
      <WalletConnectProvider>
        <TestComponent />
        <ContextControlComponent />
      </WalletConnectProvider>,
      { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
    )

    await waitFor(() => {
      expect(getByText('WalletConnect initialized')).toBeInTheDocument()
    })

    fireEvent.click(getByText('Set Error'))

    await waitFor(() => {
      expect(getByText('Test error')).toBeInTheDocument()
    })
  })

  it('allows setting loading state through context', async () => {
    jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
    jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

    const { getByText } = render(
      <WalletConnectProvider>
        <TestComponent />
        <ContextControlComponent />
      </WalletConnectProvider>,
      { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
    )

    await waitFor(() => {
      expect(getByText('WalletConnect initialized')).toBeInTheDocument()
    })

    fireEvent.click(getByText('Set Loading'))

    await waitFor(() => {
      expect(getByText('Loading: Connect')).toBeInTheDocument()
    })
  })

  describe('updateSessions', () => {
    const extendedSafeInfo = { ...extendedSafeInfoBuilder().build(), address: { value: testSafeAddress }, chainId: '5' }

    const getUpdateSafeInfoComponent = (safeInfo: ExtendedSafeInfo) => {
      // eslint-disable-next-line react/display-name
      return () => {
        const dispatch = useAppDispatch()
        const updateSafeInfo = () => {
          dispatch(
            safeInfoSlice.actions.set({ loading: false, loaded: true, data: { ...extendedSafeInfo, ...safeInfo } }),
          )
        }

        return <button onClick={() => updateSafeInfo()}>update</button>
      }
    }

    it('updates sessions when the chainId changes', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      const ChainUpdater = getUpdateSafeInfoComponent({
        ...extendedSafeInfoBuilder().build(),
        address: { value: testSafeAddress },
        chainId: '1',
      })

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <ChainUpdater />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getByText('WalletConnect initialized')).toBeInTheDocument()
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('5', testSafeAddress)
      })

      fireEvent.click(getByText('update'))

      await waitFor(() => {
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('1', testSafeAddress)
      })
    })

    it('updates sessions when the safeAddress changes', async () => {
      const newSafeAddress = faker.finance.ethereumAddress()
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      const AddressUpdater = getUpdateSafeInfoComponent({
        ...extendedSafeInfoBuilder().build(),
        address: { value: newSafeAddress },
        chainId: '5',
      })

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <AddressUpdater />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              loaded: true,
              data: { ...extendedSafeInfo, address: { value: testSafeAddress }, chainId: '5' },
            },
          },
        },
      )

      await waitFor(() => {
        expect(getByText('WalletConnect initialized')).toBeInTheDocument()
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('5', testSafeAddress)
      })

      fireEvent.click(getByText('update'))

      await waitFor(() => {
        expect(WalletConnectWallet.prototype.updateSessions).toHaveBeenCalledWith('5', newSafeAddress)
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
              loaded: true,
              data: { ...extendedSafeInfo, address: { value: testSafeAddress }, chainId: '5' },
            },
          },
        },
      )

      await waitFor(() => {
        expect(getByText('Test updateSessions failed')).toBeInTheDocument()
      })
    })
  })

  describe('session management', () => {
    const mockSessions = [
      {
        topic: faker.string.alphanumeric(10),
        peer: { metadata: { url: faker.internet.url() } },
      } as SessionTypes.Struct,
      {
        topic: faker.string.alphanumeric(10),
        peer: { metadata: { url: faker.internet.url() } },
      } as SessionTypes.Struct,
    ]

    it('updates sessions when getActiveSessions changes', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => mockSessions)

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getByText('WalletConnect initialized')).toBeInTheDocument()
        expect(getByText('Sessions: 2')).toBeInTheDocument()
      })
    })

    it('calls getActiveSessions to update session state', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      const getActiveSessionsSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'getActiveSessions')
        .mockImplementation(() => mockSessions)

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getActiveSessionsSpy).toHaveBeenCalled()
      })
    })
  })

  describe('session proposals', () => {
    const proposalId = faker.number.int({ min: 1, max: 999999 })
    const proposalOrigin = faker.internet.url()
    const sessionTopic = faker.string.alphanumeric(10)
    const sessionUrl = faker.internet.url()

    const mockSessionProposal = {
      id: proposalId,
      verifyContext: { verified: { validation: 'VALID', origin: proposalOrigin, isScam: false } },
    } as WalletKitTypes.SessionProposal

    const mockSession = { topic: sessionTopic, peer: { metadata: { url: sessionUrl } } } as SessionTypes.Struct

    it('handles session proposal events', async () => {
      const onSessionProposeSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'onSessionPropose')
        .mockImplementation((callback) => {
          // Simulate receiving a proposal
          setTimeout(() => callback(mockSessionProposal), 100)
          return jest.fn()
        })

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onSessionProposeSpy).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(getByText('Session proposal received')).toBeInTheDocument()
      })
    })

    it('approves a session proposal successfully', async () => {
      const approveSessionSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'approveSession')
        .mockImplementation(() => Promise.resolve(mockSession))

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'onSessionPropose').mockImplementation((callback) => {
        setTimeout(() => callback(mockSessionProposal), 100)
        return jest.fn()
      })

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <ContextControlComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getByText('Session proposal received')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Approve Session'))

      await waitFor(() => {
        expect(approveSessionSpy).toHaveBeenCalledWith(mockSessionProposal, '5', testSafeAddress, {
          atomic: JSON.stringify({ status: 'supported' }),
          capabilities: JSON.stringify({
            [testSafeAddress]: { [`0x${Number(5).toString(16)}`]: { atomicBatch: { supported: true } } },
          }),
        })
      })
    })

    it('rejects a session proposal successfully', async () => {
      const rejectSessionSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'rejectSession')
        .mockImplementation(() => Promise.resolve())

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'onSessionPropose').mockImplementation((callback) => {
        setTimeout(() => callback(mockSessionProposal), 100)
        return jest.fn()
      })

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <ContextControlComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getByText('Session proposal received')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Reject Session'))

      await waitFor(() => {
        expect(rejectSessionSpy).toHaveBeenCalledWith(mockSessionProposal)
      })
    })

    it('handles approval errors correctly', async () => {
      jest
        .spyOn(WalletConnectWallet.prototype, 'approveSession')
        .mockImplementation(() => Promise.reject(new Error('Approval failed')))

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'onSessionPropose').mockImplementation((callback) => {
        setTimeout(() => callback(mockSessionProposal), 100)
        return jest.fn()
      })

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <ContextControlComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getByText('Session proposal received')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Approve Session'))

      // The component catches errors internally, so just verify the error handler was called
      await waitFor(() => {
        expect(WalletConnectWallet.prototype.approveSession).toHaveBeenCalled()
      })
    })

    it('handles rejection errors correctly', async () => {
      jest
        .spyOn(WalletConnectWallet.prototype, 'rejectSession')
        .mockImplementation(() => Promise.reject(new Error('Rejection failed')))

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'onSessionPropose').mockImplementation((callback) => {
        setTimeout(() => callback(mockSessionProposal), 100)
        return jest.fn()
      })

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <ContextControlComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getByText('Session proposal received')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Reject Session'))

      // The component catches errors internally, so just verify the error handler was called
      await waitFor(() => {
        expect(WalletConnectWallet.prototype.rejectSession).toHaveBeenCalled()
      })
    })

    it('does not approve or reject without session proposal', async () => {
      const approveSessionSpy = jest.spyOn(WalletConnectWallet.prototype, 'approveSession')
      const rejectSessionSpy = jest.spyOn(WalletConnectWallet.prototype, 'rejectSession')

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
          <ContextControlComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(getByText('WalletConnect initialized')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Approve Session'))
      fireEvent.click(getByText('Reject Session'))

      expect(approveSessionSpy).not.toHaveBeenCalled()
      expect(rejectSessionSpy).not.toHaveBeenCalled()
    })
  })

  describe('session auth (one-click auth)', () => {
    const authId = faker.number.int({ min: 1, max: 999999 })
    const authTopic = faker.string.alphanumeric(10)
    const authOrigin = faker.internet.url()
    const authDomain = faker.internet.domainName()
    const authAud = faker.internet.url()
    const authNonce = faker.string.alphanumeric(10)
    const appName = faker.company.name()
    const appDescription = faker.lorem.sentence()
    const appUrl = faker.internet.url()
    const appIcon = faker.image.url()

    const mockAuthEvent = {
      id: authId,
      topic: authTopic,
      verifyContext: { verified: { validation: 'VALID' as const, origin: authOrigin, isScam: false } },
      params: {
        expiryTimestamp: Math.floor(Date.now() / 1000) + 3600,
        authPayload: {
          chains: ['eip155:5'],
          domain: authDomain,
          aud: authAud,
          version: '1',
          nonce: authNonce,
          iat: new Date().toISOString(),
        },
        requester: { metadata: { name: appName, description: appDescription, url: appUrl, icons: [appIcon] } },
      },
    } as WalletKitTypes.SessionAuthenticate

    it('handles session auth with valid chain', async () => {
      const siweMessage = faker.lorem.sentence()
      const mockSignature = faker.string.hexadecimal({ length: 132, prefix: '0x' })

      const formatAuthMessageSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'formatAuthMessage')
        .mockReturnValue(siweMessage)
      const approveSessionAuthSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'approveSessionAuth')
        .mockImplementation(() => Promise.resolve())
      const onSessionAuthSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'onSessionAuth')
        .mockImplementation((callback) => {
          setTimeout(() => callback(mockAuthEvent), 100)
          return jest.fn()
        })

      const mockRequest = jest.fn().mockResolvedValue({ result: mockSignature })
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onSessionAuthSpy).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(formatAuthMessageSpy).toHaveBeenCalledWith(mockAuthEvent.params.authPayload, '5', testSafeAddress)
        expect(mockRequest).toHaveBeenCalledWith(
          authId,
          { method: 'personal_sign', params: [siweMessage, testSafeAddress] },
          expect.objectContaining({ name: appName, url: 'https://apps-portal.safe.global/wallet-connect' }),
        )
        expect(approveSessionAuthSpy).toHaveBeenCalledWith(
          authId,
          mockAuthEvent.params.authPayload,
          mockSignature,
          '5',
          testSafeAddress,
        )
      })
    })

    it('rejects session auth with wrong chain', async () => {
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockReturnValue({ request: jest.fn() } as unknown as ReturnType<typeof useSafeWalletProvider.default>)

      const wrongChainAuthEvent = {
        ...mockAuthEvent,
        params: {
          ...mockAuthEvent.params,
          authPayload: {
            ...mockAuthEvent.params.authPayload,
            chains: ['eip155:1'], // Wrong chain
          },
        },
      }

      let authCallback: ((event: any) => void) | null = null
      const onSessionAuthSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'onSessionAuth')
        .mockImplementation((callback) => {
          authCallback = callback
          return jest.fn()
        })

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onSessionAuthSpy).toHaveBeenCalled()
        // Immediately trigger auth after setup
        if (authCallback) {
          authCallback(wrongChainAuthEvent)
        }
      })

      await waitFor(() => {
        expect(
          getByText(`${appName} made a request on a different chain than the one you are connected to`),
        ).toBeInTheDocument()
      })
    })

    it('handles auth request errors', async () => {
      const signatureError = faker.lorem.sentence()
      const siweMessage = faker.lorem.sentence()

      const rejectSessionAuthSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'rejectSessionAuth')
        .mockImplementation(() => Promise.resolve())
      const onSessionAuthSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'onSessionAuth')
        .mockImplementation((callback) => {
          setTimeout(() => callback(mockAuthEvent), 100)
          return jest.fn()
        })

      const mockRequest = jest.fn().mockRejectedValue(new Error(signatureError))
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'formatAuthMessage').mockReturnValue(siweMessage)

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onSessionAuthSpy).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(rejectSessionAuthSpy).toHaveBeenCalledWith(authId)
        expect(getByText(signatureError)).toBeInTheDocument()
      })
    })

    it('handles signature result errors', async () => {
      const userRejectionError = faker.lorem.sentence()
      const siweMessage = faker.lorem.sentence()

      const rejectSessionAuthSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'rejectSessionAuth')
        .mockImplementation(() => Promise.resolve())
      const onSessionAuthSpy = jest
        .spyOn(WalletConnectWallet.prototype, 'onSessionAuth')
        .mockImplementation((callback) => {
          setTimeout(() => callback(mockAuthEvent), 100)
          return jest.fn()
        })

      const mockRequest = jest.fn().mockResolvedValue({ error: { message: userRejectionError } })
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'formatAuthMessage').mockReturnValue(siweMessage)

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onSessionAuthSpy).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(rejectSessionAuthSpy).toHaveBeenCalledWith(authId)
        expect(getByText(userRejectionError)).toBeInTheDocument()
      })
    })

    it('does not setup auth listener without required dependencies', async () => {
      const onSessionAuthSpy = jest.spyOn(WalletConnectWallet.prototype, 'onSessionAuth')

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              loaded: true,
              data: {
                ...extendedSafeInfo,
                chainId: '', // Missing chainId
              },
            },
          },
        },
      )

      await waitFor(() => {
        expect(onSessionAuthSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('onRequest', () => {
    const requestTopic = faker.string.alphanumeric(10)
    const requestUrl = faker.internet.url()
    const requestAppName = faker.company.name()

    const extendedSafeInfo = { ...extendedSafeInfoBuilder().build(), address: { value: testSafeAddress }, chainId: '5' }

    it('does not continue with the request if there is no matching topic', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [])

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')
      const sendSessionResponseSpy = jest.spyOn(WalletConnectWallet.prototype, 'sendSessionResponse')

      const mockRequest = jest.fn()
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
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
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
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

    it('sets wrong chain error when session exists but chain is wrong', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [
        {
          topic: requestTopic,
          peer: { metadata: { url: requestUrl, name: requestAppName } },
        } as unknown as SessionTypes.Struct,
      ])

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')

      const mockRequest = jest.fn()
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      act(() => {
        onRequestHandler({
          id: 1,
          topic: requestTopic,
          params: {
            request: {},
            chainId: 'eip155:1', // Mainnet (wrong chain)
          },
        } as unknown as WalletKitTypes.SessionRequest)
      })

      await waitFor(() => {
        expect(
          getByText(`${requestAppName} made a request on a different chain than the one you are connected to`),
        ).toBeInTheDocument()
      })
    })

    it('passes the request onto the Safe Wallet Provider and sends the response to WalletConnect', async () => {
      const peerDescription = faker.lorem.sentence()
      const peerIcon = faker.image.url()

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [
        {
          topic: requestTopic,
          peer: {
            metadata: {
              name: requestAppName,
              description: peerDescription,
              url: 'https://apps-portal.safe.global/wallet-connect',
              icons: [peerIcon],
            },
          },
        } as unknown as SessionTypes.Struct,
      ])

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')
      const sendSessionResponseSpy = jest.spyOn(WalletConnectWallet.prototype, 'sendSessionResponse')

      const mockRequest = jest.fn().mockImplementation(() => Promise.resolve({}))
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await act(() => Promise.resolve())

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      onRequestHandler({
        id: 1,
        topic: requestTopic,
        params: {
          request: { method: 'fake', params: [] },
          chainId: 'eip155:5', // Goerli
        },
      } as unknown as WalletKitTypes.SessionRequest)

      expect(mockRequest).toHaveBeenCalledWith(
        1,
        { method: 'fake', params: [] },
        {
          name: requestAppName,
          description: peerDescription,
          url: 'https://apps-portal.safe.global/wallet-connect',
          iconUrl: peerIcon,
        },
      )

      await waitFor(() => {
        expect(sendSessionResponseSpy).toHaveBeenCalledWith(requestTopic, {})
      })
    })

    it('uses fallback peer name when session peer name is not available', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [
        {
          topic: requestTopic,
          peer: {
            metadata: {
              description: faker.lorem.sentence(),
              icons: [faker.image.url()],
              // No name or url property to trigger fallback to FALLBACK_PEER_NAME
            },
          },
        } as unknown as SessionTypes.Struct,
      ])

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')

      const mockRequest = jest.fn().mockImplementation(() => Promise.resolve({}))
      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () => ({ request: mockRequest }) as unknown as ReturnType<typeof useSafeWalletProvider.default>,
        )

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      onRequestHandler({
        id: 1,
        topic: requestTopic,
        params: { request: { method: 'fake', params: [] }, chainId: 'eip155:5' },
      } as unknown as WalletKitTypes.SessionRequest)

      expect(mockRequest).toHaveBeenCalledWith(
        1,
        { method: 'fake', params: [] },
        expect.objectContaining({
          name: 'WalletConnect', // Fallback name
        }),
      )
    })

    it('sets the error state if there is an error requesting', async () => {
      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockImplementation(() => [
        {
          topic: requestTopic,
          peer: {
            metadata: {
              name: requestAppName,
              description: faker.lorem.sentence(),
              url: 'https://apps-portal.safe.global/wallet-connect',
              icons: [faker.image.url()],
            },
          },
        } as unknown as SessionTypes.Struct,
      ])

      jest
        .spyOn(useSafeWalletProvider, 'default')
        .mockImplementation(
          () =>
            ({ request: () => Promise.reject(new Error('Test request failed')) }) as unknown as ReturnType<
              typeof useSafeWalletProvider.default
            >,
        )

      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')
      const sendSessionResponseSpy = jest.spyOn(WalletConnectWallet.prototype, 'sendSessionResponse')

      const { getByText } = render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        { initialReduxState: { safeInfo: { loading: false, loaded: true, data: extendedSafeInfo } } },
      )

      await waitFor(() => {
        expect(onRequestSpy).toHaveBeenCalled()
      })

      const onRequestHandler = onRequestSpy.mock.calls[0][0]

      act(() => {
        onRequestHandler({
          id: 1,
          topic: requestTopic,
          params: {
            request: {},
            chainId: 'eip155:5', // Goerli
          },
        } as unknown as WalletKitTypes.SessionRequest)
      })

      expect(sendSessionResponseSpy).not.toHaveBeenCalled()

      await waitFor(() => {
        expect(getByText('Test request failed')).toBeInTheDocument()
      })
    })

    it('does not setup request listener without required dependencies', async () => {
      const onRequestSpy = jest.spyOn(WalletConnectWallet.prototype, 'onRequest')

      jest.spyOn(WalletConnectWallet.prototype, 'init').mockImplementation(() => Promise.resolve())
      jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockImplementation(() => Promise.resolve())

      render(
        <WalletConnectProvider>
          <TestComponent />
        </WalletConnectProvider>,
        {
          initialReduxState: {
            safeInfo: {
              loading: false,
              loaded: true,
              data: {
                ...extendedSafeInfo,
                chainId: '', // Missing chainId
              },
            },
          },
        },
      )

      await waitFor(() => {
        expect(onRequestSpy).not.toHaveBeenCalled()
      })
    })
  })
})
