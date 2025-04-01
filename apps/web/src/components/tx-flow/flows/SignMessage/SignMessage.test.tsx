import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type Safe from '@safe-global/protocol-kit'
import { act } from 'react'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { hexlify, zeroPadValue, toUtf8Bytes } from 'ethers'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
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
import { getSafeMessage } from '@safe-global/safe-gateway-typescript-sdk'
import { chainBuilder } from '@/tests/builders/chains'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getSafeMessage: jest.fn(),
}))

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
  })

  describe('EIP-191 messages', () => {
    const EXAMPLE_MESSAGE = 'Hello world!'

    it('renders the (decoded) message', () => {
      const { getByText } = render(
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
      const { getByText } = render(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} requestId="123" />,
      )

      expect(getByText('0xaa05af77f274774b8bdc7b61d98bc40da523dc2821fdea555f4d6aa413199bcc')).toBeInTheDocument()
    })

    it('generates the SafeMessage hash if not provided', () => {
      const { getByText } = render(
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
      const { getByText } = render(
        <SignMessage requestId="123" logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} />,
      )

      Object.keys(EXAMPLE_MESSAGE.message).forEach((key) => {
        expect(getByText(`${key}(`, { exact: false })).toBeInTheDocument()
      })

      expect(getByText('Hello EIP-1271!', { exact: false })).toBeInTheDocument()
    })

    it('displays the SafeMessage message', () => {
      const { getByText } = render(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} requestId="123" />,
      )

      expect(getByText('0xd5ffe9f6faa9cc9294673fb161b1c7b3e0c98241e90a38fc6c451941f577fb19')).toBeInTheDocument()
    })

    it('generates the SafeMessage hash if not provided', () => {
      const { getByText } = render(
        <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={EXAMPLE_MESSAGE} requestId="123" />,
      )

      expect(getByText('0x10c926c4f417e445de3fddc7ad8c864f81b9c81881b88eba646015de10d21613')).toBeInTheDocument()
    })
  })

  it('proposes a message if not already proposed', async () => {
    jest.spyOn(useIsSafeOwnerHook, 'default').mockImplementation(() => true)
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(useWalletHook, 'default').mockReturnValue({} as ConnectedWallet)
    ;(getSafeMessage as jest.Mock).mockRejectedValue(new Error('SafeMessage not found'))

    const { getByText, baseElement } = render(
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

    ;(getSafeMessage as jest.Mock).mockResolvedValue(msg)

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
      } as SafeInfo,
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

    jest.spyOn(useSafeMessage, 'default').mockReturnValueOnce([msg, jest.fn, undefined])

    const { getByText, rerender } = render(
      <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={messageText} requestId="123" />,
    )

    const confirmationSpy = jest
      .spyOn(sender, 'dispatchSafeMsgConfirmation')
      .mockImplementation(() => Promise.resolve())

    const button = getByText('Sign')
    expect(button).toBeEnabled()

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

    ;(getSafeMessage as jest.Mock).mockResolvedValue(newMsg)

    act(() => {
      fireEvent.click(button)
    })

    jest.spyOn(useSafeMessage, 'default').mockReturnValue([newMsg, jest.fn, undefined])

    rerender(<SignMessage logoUri="www.fake.com/test.png" name="Test App" message={messageText} requestId="123" />)

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

    const { getByText } = render(
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

    const { getByText, queryByText } = render(
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

    const { getByText } = render(
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
      } as SafeInfo,
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

    const { getByText } = render(
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
    ;(getSafeMessage as jest.Mock).mockRejectedValue(new Error('SafeMessage not found'))

    const proposalSpy = jest
      .spyOn(sender, 'dispatchSafeMsgProposal')
      .mockImplementation(() => Promise.reject(new Error('Test error')))

    const { getByText } = render(
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
      } as SafeInfo,
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
    ;(getSafeMessage as jest.Mock).mockResolvedValue(msg)

    jest.spyOn(useSafeMessage, 'default').mockReturnValue([msg, jest.fn(), undefined])

    const { getByText } = render(
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
      } as SafeInfo,
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
    ;(getSafeMessage as jest.Mock).mockResolvedValue(msg)

    const { getByText } = render(
      <SignMessage logoUri="www.fake.com/test.png" name="Test App" message={messageText} requestId="123" />,
    )

    await waitFor(() => {
      expect(getByText('Message successfully signed')).toBeInTheDocument()
    })
  })
})
