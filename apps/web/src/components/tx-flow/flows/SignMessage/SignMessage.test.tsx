import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type Safe from '@safe-global/protocol-kit'
import { act } from 'react'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { hexlify, zeroPadValue, toUtf8Bytes } from 'ethers'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import SignMessage from './SignMessage'

import * as useIsWrongChainHook from '@/hooks/useIsWrongChain'
import * as useIsSafeOwnerHook from '@/hooks/useIsSafeOwner'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useChainsHook from '@/hooks/useChains'
import * as sender from '@/services/safe-messages/safeMsgSender'
import * as onboard from '@/hooks/wallets/useOnboard'
import * as useSafeMessage from '@/hooks/messages/useSafeMessage'
import * as sdk from '@/hooks/coreSDK/safeCoreSDK'
import { render, fireEvent, waitFor } from '@/tests/test-utils'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { EIP1193Provider, WalletState, AppState, OnboardAPI } from '@web3-onboard/core'
import { generateSafeMessageHash } from '@safe-global/utils/utils/safe-messages'
import { chainBuilder } from '@/tests/builders/chains'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { Message } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import type { ReactElement } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'

import * as useIsPinnedSafeHook from '@/hooks/useIsPinnedSafe'
import * as useTrustSafeHook from '@/features/myAccounts/hooks/useTrustSafe'

const renderWithSafeShield = (ui: ReactElement) => {
  return render(<SafeShieldProvider>{ui}</SafeShieldProvider>)
}

let mockProvider = {
  request: jest.fn,
} as unknown as EIP1193Provider

const mockOnboardState = {
  chains: [],
  walletModules: [],
  wallets: [
    {
      label: 'Wallet 1',
      icon: '',
      provider: mockProvider,
      chains: [{ id: '0x5', namespace: 'evm' }],
      accounts: [
        {
          address: '0x1234567890123456789012345678901234567890',
          ens: null,
          uns: null,
          balance: null,
        },
      ],
    },
  ] as unknown as WalletState[],
  accountCenter: {
    enabled: true,
  },
} as unknown as AppState

const mockOnboard = {
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  setChain: jest.fn(),
  state: {
    select: (key: keyof AppState) => ({
      subscribe: (next: any) => {
        next(mockOnboardState[key])

        return {
          unsubscribe: jest.fn(),
        }
      },
    }),
    get: () => mockOnboardState,
  },
} as unknown as OnboardAPI

const extendedSafeInfo = {
  ...extendedSafeInfoBuilder().build(),
  version: '1.3.0',
  address: {
    value: zeroPadValue('0x01', 20),
  },
  chainId: '5',
  threshold: 2,
  deployed: true,
}

describe('SignMessage', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: zeroPadValue('0x01', 20),
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    jest.spyOn(useIsWrongChainHook, 'default').mockImplementation(() => false)

    jest.spyOn(sdk, 'useSafeSDK').mockReturnValue({} as unknown as Safe)

    // Mock hooks for Safe Shield untrusted Safe check
    jest.spyOn(useIsPinnedSafeHook, 'default').mockImplementation(() => true)
    jest.spyOn(useTrustSafeHook, 'useTrustSafe').mockImplementation(() => ({ trustSafe: jest.fn() }))
  })

  describe('EIP-191 messages', () => {
    const EXAMPLE_MESSAGE = 'Hello world!'

    it('renders the (decoded) message', () => {
      const { getByText } = renderWithSafeShield(
        <SignMessage
          requestId="123"
          logoUri="www.fake.com/test.png"
          name="Test App"
          message={hexlify(toUtf8Bytes(EXAMPLE_MESSAGE))}
        />,
      )

      expect(getByText(EXAMPLE_MESSAGE)).toBeInTheDocument()
    })

    it('displays the SafeMessage message', () => {
      const { getByText } = renderWithSafeShield(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} requestId="123" />,
      )

      expect(getByText('0xaa05af77f274774b8bdc7b61d98bc40da523dc2821fdea555f4d6aa413199bcc')).toBeInTheDocument()
    })

    it('generates the SafeMessage hash if not provided', () => {
      const { getByText } = renderWithSafeShield(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} requestId="123" />,
      )

      expect(getByText('0x73d0948ac608c5d00a6dd26dd396cce79b459307ea365f5a5bd5d3119c2d9708')).toBeInTheDocument()
    })
  })

  describe('EIP-712 messages', () => {
    const EXAMPLE_MESSAGE = {
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

    it('renders the message', () => {
      const { getByText } = renderWithSafeShield(
        <SignMessage requestId="123" logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} />,
      )

      Object.keys(EXAMPLE_MESSAGE.message).forEach((key) => {
        expect(getByText(`${key}(`, { exact: false })).toBeInTheDocument()
      })

      expect(getByText('Hello EIP-1271!', { exact: false })).toBeInTheDocument()
    })

    it('displays the SafeMessage message', () => {
      const { getByText } = renderWithSafeShield(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} requestId="123" />,
      )

      expect(getByText('0xd5ffe9f6faa9cc9294673fb161b1c7b3e0c98241e90a38fc6c451941f577fb19')).toBeInTheDocument()
    })

    it('generates the SafeMessage hash if not provided', () => {
      const { getByText } = renderWithSafeShield(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} requestId="123" />,
      )

      expect(getByText('0x10c926c4f417e445de3fddc7ad8c864f81b9c81881b88eba646015de10d21613')).toBeInTheDocument()
    })
  })

  it('proposes a message if not already proposed', async () => {
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useWalletHook, 'default').mockReturnValue({} as ConnectedWallet)

    // Mock message not found
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
        return HttpResponse.error()
      }),
    )

    const { getByText, baseElement } = renderWithSafeShield(
      <SignMessage
        logoUri="www.fake.com/test.png"
        name="Test App"
        message="Hello world!"
        requestId="123"
        origin="http://localhost:3000"
      />,
    )

    const proposalSpy = jest.spyOn(sender, 'dispatchSafeMsgProposal').mockImplementation(() => Promise.resolve())
    const mockMessageHash = '0x456'
    const msg = {
      type: 'MESSAGE',
      messageHash: mockMessageHash,
      confirmations: [
        {
          owner: {
            value: zeroPadValue('0x02', 20),
          },
        },
      ],
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
    } as unknown as MessageItem

    // Mock getSafeMessage response
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
        const msgWithoutType = { ...msg }
        delete (msgWithoutType as any).type
        return HttpResponse.json(msgWithoutType as Message)
      }),
    )

    const button = getByText('Sign')

    act(() => {
      fireEvent.click(button)
    })

    expect(proposalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        safe: extendedSafeInfo,
        message: 'Hello world!',
        origin: 'http://localhost:3000',
        //onboard: expect.anything(),
      }),
    )

    // Immediately refetches message and displays confirmation
    await waitFor(() => {
      expect(baseElement).toHaveTextContent('0x0000...0002')
      expect(baseElement).toHaveTextContent('1 of 2')
      expect(baseElement).toHaveTextContent('Confirmation #2')
    })
  })

  it('confirms the message if already proposed', async () => {
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
    jest.spyOn(useWalletHook, 'default').mockReturnValue({ provider: mockProvider } as unknown as ConnectedWallet)

    const messageText = 'Hello world!'
    const messageHash = generateSafeMessageHash(
      {
        version: '1.3.0',
        address: {
          value: zeroPadValue('0x01', 20),
        },
        chainId: '5',
      } as SafeState,
      messageText,
    )
    const msg = {
      type: 'MESSAGE',
      messageHash,
      confirmations: [
        {
          owner: {
            value: zeroPadValue('0x02', 20),
          },
        },
      ],
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
    } as unknown as MessageItem

    const newMsg = {
      ...msg,
      confirmations: [
        {
          owner: {
            value: zeroPadValue('0x02', 20),
          },
        },
        {
          owner: {
            value: zeroPadValue('0x03', 20),
          },
        },
      ],
      confirmationsRequired: 2,
      confirmationsSubmitted: 2,
      preparedSignature: '0x789',
    } as unknown as MessageItem

    // Mock getSafeMessage response
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
        const msgWithoutType = { ...newMsg }
        delete (msgWithoutType as any).type
        return HttpResponse.json(msgWithoutType as Message)
      }),
    )

    // Use a mutable object to control the return value
    let currentMessage = msg
    const mockSetMessage = jest.fn((newVal) => {
      currentMessage = newVal
    })

    jest.spyOn(useSafeMessage, 'default').mockImplementation(() => [currentMessage, mockSetMessage, undefined])

    const { getByText } = renderWithSafeShield(
      <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={messageText} requestId="123" />,
    )

    const confirmationSpy = jest
      .spyOn(sender, 'dispatchSafeMsgConfirmation')
      .mockImplementation(() => Promise.resolve())

    const button = getByText('Sign')
    expect(button).toBeEnabled()

    act(() => {
      fireEvent.click(button)
    })

    expect(confirmationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        safe: extendedSafeInfo,
        message: 'Hello world!',
        provider: expect.anything(),
      }),
    )

    await waitFor(() => {
      expect(getByText('Message successfully signed')).toBeInTheDocument()
    })
  })

  it('displays an error if no wallet is connected', () => {
    jest.spyOn(useWalletHook, 'default').mockReturnValue(null)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => false)
    jest.spyOn(useSafeMessage, 'default').mockImplementation(() => [undefined, jest.fn(), undefined])

    const { getByText } = renderWithSafeShield(
      <SignMessage
        logoUri="www.fake.com/test.png"
        name="Test App"
        message="Hello world!"
        requestId="123"
        origin="http://localhost:3000"
      />,
    )

    expect(getByText('No wallet is connected.')).toBeInTheDocument()

    expect(getByText('Sign')).toBeDisabled()
  })

  it('displays a network switch warning if connected to the wrong chain', () => {
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
    jest.spyOn(useIsWrongChainHook, 'default').mockImplementation(() => true)
    jest.spyOn(useChainsHook, 'useCurrentChain').mockReturnValue(chainBuilder().build())
    jest.spyOn(useSafeMessage, 'default').mockImplementation(() => [undefined, jest.fn(), undefined])

    const { getByText, queryByText } = renderWithSafeShield(
      <SignMessage
        logoUri="www.fake.com/test.png"
        name="Test App"
        message="Hello world!"
        requestId="123"
        origin="http://localhost:3000"
      />,
    )

    expect(getByText('Change your wallet network')).toBeInTheDocument()
    expect(queryByText('Sign')).toBeDisabled()
  })

  it('displays an error if not an owner', () => {
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useWalletHook, 'default').mockImplementation(
      () =>
        ({
          address: zeroPadValue('0x07', 20),
        }) as ConnectedWallet,
    )
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => false)
    jest.spyOn(useSafeMessage, 'default').mockImplementation(() => [undefined, jest.fn(), undefined])

    const { getByText } = renderWithSafeShield(
      <SignMessage
        logoUri="www.fake.com/test.png"
        name="Test App"
        message="Hello world!"
        requestId="123"
        origin="http://localhost:3000"
      />,
    )

    expect(
      getByText("You are currently not a signer of this Safe Account and won't be able to confirm this message."),
    ).toBeInTheDocument()

    expect(getByText('Sign')).toBeDisabled()
  })

  it('displays a success message if the message has already been signed', async () => {
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
    jest.spyOn(useWalletHook, 'default').mockImplementation(
      () =>
        ({
          address: zeroPadValue('0x02', 20),
        }) as ConnectedWallet,
    )
    const messageText = 'Hello world!'
    const messageHash = generateSafeMessageHash(
      {
        version: '1.3.0',
        address: {
          value: zeroPadValue('0x01', 20),
        },
        chainId: '5',
      } as SafeState,
      messageText,
    )
    const msg = {
      type: 'MESSAGE',
      messageHash,
      confirmations: [
        {
          owner: {
            value: zeroPadValue('0x02', 20),
          },
        },
      ],
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
    } as unknown as MessageItem

    jest.spyOn(useSafeMessage, 'default').mockReturnValue([msg, jest.fn, undefined])

    const { getByText } = renderWithSafeShield(
      <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={messageText} requestId="123" />,
    )

    await waitFor(() => {
      expect(getByText('Your connected wallet has already signed this message.')).toBeInTheDocument()

      expect(getByText('Sign')).toBeDisabled()
    })
  })

  it('displays an error if the message could not be proposed', async () => {
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useWalletHook, 'default').mockImplementation(
      () =>
        ({
          address: zeroPadValue('0x03', 20),
        }) as ConnectedWallet,
    )

    jest.spyOn(useSafeMessage, 'default').mockReturnValue([undefined, jest.fn(), undefined])

    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)

    // Mock message not found
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
        return HttpResponse.error()
      }),
    )

    const proposalSpy = jest
      .spyOn(sender, 'dispatchSafeMsgProposal')
      .mockImplementation(() => Promise.reject(new Error('Test error')))

    const { getByText } = renderWithSafeShield(
      <SignMessage
        logoUri="www.fake.com/test.png"
        name="Test App"
        message="Hello world!"
        requestId="123"
        origin="http://localhost:3000"
      />,
    )

    const button = getByText('Sign')
    expect(button).not.toBeDisabled()

    act(() => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(proposalSpy).toHaveBeenCalled()
      expect(getByText('Error confirming the message. Please try again.')).toBeInTheDocument()
    })
  })

  it('displays an error if the message could not be confirmed', async () => {
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
    jest.spyOn(useWalletHook, 'default').mockImplementation(
      () =>
        ({
          address: zeroPadValue('0x03', 20),
        }) as ConnectedWallet,
    )

    const messageText = 'Hello world!'
    const messageHash = generateSafeMessageHash(
      {
        version: '1.3.0',
        address: {
          value: zeroPadValue('0x01', 20),
        },
        chainId: '5',
      } as SafeState,
      messageText,
    )
    const msg = {
      type: 'MESSAGE',
      messageHash,
      confirmations: [
        {
          owner: {
            value: zeroPadValue('0x02', 20),
          },
        },
      ],
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
    } as unknown as MessageItem

    // Mock getSafeMessage response
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
        const msgWithoutType = { ...msg }
        delete (msgWithoutType as any).type
        return HttpResponse.json(msgWithoutType as Message)
      }),
    )

    jest.spyOn(useSafeMessage, 'default').mockReturnValue([msg, jest.fn(), undefined])

    const { getByText } = renderWithSafeShield(
      <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={messageText} requestId="123" />,
    )

    await act(async () => {
      Promise.resolve()
    })

    const confirmationSpy = jest
      .spyOn(sender, 'dispatchSafeMsgConfirmation')
      .mockImplementation(() => Promise.reject(new Error('Error confirming')))

    const button = getByText('Sign')

    expect(button).toBeEnabled()

    act(() => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(confirmationSpy).toHaveBeenCalled()
      expect(getByText('Error confirming the message. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows all signatures and success message if message has already been signed', async () => {
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
    jest.spyOn(useWalletHook, 'default').mockImplementation(
      () =>
        ({
          address: zeroPadValue('0x03', 20),
        }) as ConnectedWallet,
    )

    const messageText = 'Hello world!'
    const messageHash = generateSafeMessageHash(
      {
        version: '1.3.0',
        address: {
          value: zeroPadValue('0x01', 20),
        },
        chainId: '5',
      } as SafeState,
      messageText,
    )
    const msg = {
      type: 'MESSAGE',
      messageHash,
      confirmations: [
        {
          owner: {
            value: zeroPadValue('0x02', 20),
          },
        },
        {
          owner: {
            value: zeroPadValue('0x03', 20),
          },
        },
      ],
      confirmationsRequired: 2,
      confirmationsSubmitted: 2,
      preparedSignature: '0x678',
    } as unknown as MessageItem

    jest.spyOn(useSafeMessage, 'default').mockReturnValue([msg, jest.fn(), undefined])

    // Mock getSafeMessage response
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
        const msgWithoutType = { ...msg }
        delete (msgWithoutType as any).type
        return HttpResponse.json(msgWithoutType as Message)
      }),
    )

    const { getByText } = renderWithSafeShield(
      <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={messageText} requestId="123" />,
    )

    await waitFor(() => {
      expect(getByText('Message successfully signed')).toBeInTheDocument()
    })
  })

  describe('Safe Shield integration', () => {
    const EXAMPLE_EIP712_MESSAGE = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      primaryType: 'Person',
      domain: {
        name: 'Test Dapp',
        version: '1.0',
        chainId: 5,
        verifyingContract: '0x0000000000000000000000000000000000000000',
      },
      message: {
        name: 'Alice',
        wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
    }

    let mockSetSafeMessage: jest.Mock
    let mockSafeTxContext: SafeTxContextParams

    beforeEach(() => {
      jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
      jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
      jest.spyOn(useWalletHook, 'default').mockReturnValue({} as ConnectedWallet)
      jest.spyOn(useSafeMessage, 'default').mockImplementation(() => [undefined, jest.fn(), undefined])

      mockSetSafeMessage = jest.fn()
      mockSafeTxContext = {
        safeTx: undefined,
        setSafeTx: jest.fn(),
        safeMessage: undefined,
        setSafeMessage: mockSetSafeMessage,
        safeTxError: undefined,
        setSafeTxError: jest.fn(),
        nonce: undefined,
        setNonce: jest.fn(),
        nonceNeeded: true,
        setNonceNeeded: jest.fn(),
        safeTxGas: undefined,
        setSafeTxGas: jest.fn(),
        txOrigin: undefined,
        setTxOrigin: jest.fn(),
        isReadOnly: false,
      }
    })

    it('sets EIP-712 message in SafeTxContext for threat analysis', async () => {
      let capturedSafeMessage: any = undefined
      mockSetSafeMessage.mockImplementation((msg) => {
        capturedSafeMessage = msg
      })

      const { getByText } = render(
        <SafeTxContext.Provider value={mockSafeTxContext}>
          <SafeShieldProvider>
            <SignMessage
              logoUri="www.fake.com/test.png"
              name="Test App"
              message={EXAMPLE_EIP712_MESSAGE}
              requestId="123"
            />
          </SafeShieldProvider>
        </SafeTxContext.Provider>,
      )

      await waitFor(() => {
        expect(getByText('Alice')).toBeInTheDocument()
      })

      expect(mockSetSafeMessage).toHaveBeenCalled()
      expect(capturedSafeMessage).toEqual(EXAMPLE_EIP712_MESSAGE)
    })

    it('does not set plain text messages in SafeTxContext (not EIP-712)', async () => {
      const { getByText } = render(
        <SafeTxContext.Provider value={mockSafeTxContext}>
          <SafeShieldProvider>
            <SignMessage logoUri="www.fake.com/test.png" name="Test App" message="Hello world!" requestId="123" />
          </SafeShieldProvider>
        </SafeTxContext.Provider>,
      )

      await waitFor(() => {
        expect(getByText('Hello world!')).toBeInTheDocument()
      })

      expect(mockSetSafeMessage).not.toHaveBeenCalled()
    })

    it('disables Sign button when risk confirmation is needed but not confirmed', async () => {
      jest.spyOn(require('@/features/safe-shield/SafeShieldContext'), 'useSafeShield').mockReturnValue({
        needsRiskConfirmation: true,
        isRiskConfirmed: false,
        setIsRiskConfirmed: jest.fn(),
        setRecipientAddresses: jest.fn(),
        setSafeTx: jest.fn(),
        safeTx: undefined,
        recipient: undefined,
        contract: undefined,
        threat: undefined,
        safeAnalysis: null,
        addToTrustedList: jest.fn(),
      })

      const { getByText } = renderWithSafeShield(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message="Hello world!" requestId="123" />,
      )

      await waitFor(() => {
        expect(getByText('Sign')).toBeDisabled()
      })
    })

    it('enables Sign button when risk is confirmed', async () => {
      jest.spyOn(require('@/features/safe-shield/SafeShieldContext'), 'useSafeShield').mockReturnValue({
        needsRiskConfirmation: true,
        isRiskConfirmed: true,
        setIsRiskConfirmed: jest.fn(),
        setRecipientAddresses: jest.fn(),
        setSafeTx: jest.fn(),
        safeTx: undefined,
        recipient: undefined,
        contract: undefined,
        threat: undefined,
        safeAnalysis: null,
        addToTrustedList: jest.fn(),
      })

      const { getByText } = renderWithSafeShield(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message="Hello world!" requestId="123" />,
      )

      await waitFor(() => {
        expect(getByText('Sign')).toBeEnabled()
      })
    })

    it('shows RiskConfirmation checkbox when threat is detected', async () => {
      jest.spyOn(require('@/features/safe-shield/SafeShieldContext'), 'useSafeShield').mockReturnValue({
        needsRiskConfirmation: true,
        isRiskConfirmed: false,
        setIsRiskConfirmed: jest.fn(),
        setRecipientAddresses: jest.fn(),
        setSafeTx: jest.fn(),
        safeTx: undefined,
        recipient: undefined,
        contract: undefined,
        threat: undefined,
        safeAnalysis: null,
        addToTrustedList: jest.fn(),
      })

      const { getByTestId, getByText } = renderWithSafeShield(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message="Hello world!" requestId="123" />,
      )

      await waitFor(() => {
        expect(getByTestId('risk-confirmation-checkbox')).toBeInTheDocument()
        expect(getByText('I understand the risks and would like to proceed with this message.')).toBeInTheDocument()
      })
    })
  })
})
