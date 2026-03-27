import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import SignInButton from './index'

const mockSignIn = jest.fn()
const mockDispatch = jest.fn()
const mockWallet = jest.fn<ConnectedWallet | null, []>()
const mockIsSmartContractWallet = jest.fn<Promise<boolean>, [string, string]>()
const mockIsLedger = jest.fn<boolean, [unknown]>()
const mockGetWalletConnectLabel = jest.fn<string | undefined, [unknown]>()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  OVERVIEW_EVENTS: { OPEN_ONBOARD: {} },
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    SIGN_IN_BUTTON: { action: 'Open sign in message', category: 'spaces' },
    SPACES_SIWE_SUCCESS: { action: 'Spaces SIWE success', category: 'spaces' },
    SPACES_SIWE_FAILURE: { action: 'Spaces SIWE failure', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@/services/siwe/useSiwe', () => ({
  useSiwe: () => ({ signIn: mockSignIn, loading: false }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  setAuthenticated: (value: number) => ({ type: 'auth/setAuthenticated', payload: value }),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@/services/exceptions', () => ({
  logError: jest.fn(),
}))

jest.mock('@safe-global/utils/services/exceptions/ErrorCodes', () => ({
  default: { _640: '_640' },
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWallet(),
}))

jest.mock('@/hooks/wallets/useOnboard', () => ({
  getWalletConnectLabel: (wallet: unknown) => mockGetWalletConnectLabel(wallet),
}))

jest.mock('@/utils/wallets', () => ({
  isSmartContractWallet: (chainId: string, address: string) => mockIsSmartContractWallet(chainId, address),
  isLedger: (wallet: unknown) => mockIsLedger(wallet),
}))

jest.mock('@/components/welcome/WelcomeLogin/WalletLogin', () => ({
  __esModule: true,
  default: ({ onContinue }: { onContinue: () => void }) => <button onClick={onContinue}>Sign in</button>,
}))

const defaultWallet = {
  label: 'MetaMask',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: '1',
  provider: {} as unknown,
} as ConnectedWallet

describe('SignInButton tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWallet.mockReturnValue(defaultWallet)
    mockIsSmartContractWallet.mockResolvedValue(false)
    mockIsLedger.mockReturnValue(false)
    mockGetWalletConnectLabel.mockReturnValue(undefined)
  })

  it('tracks SPACES_SIWE_SUCCESS with spaceId sent to both GA (label) and Mixpanel (additionalParameters)', async () => {
    mockSignIn.mockResolvedValue({ token: 'abc' })

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.SPACES_SIWE_SUCCESS, label: '42' }, // GA receives spaceId as label
        { spaceId: '42' }, // Mixpanel receives spaceId as additionalParameters
      )
    })
  })

  it('tracks SPACES_SIWE_FAILURE with failure_reason on sign in error', async () => {
    const error = new Error('User rejected')
    mockSignIn.mockRejectedValue(error)

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SPACES_SIWE_FAILURE, {
        'Failure Reason': 'User rejected',
      })
    })
  })

  it('tracks SPACES_SIWE_FAILURE when signIn returns an error object', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Signature failed') })

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SPACES_SIWE_FAILURE, {
        'Failure Reason': 'Signature failed',
      })
    })
  })

  it('does not track SPACES_SIWE_SUCCESS when signIn returns null', async () => {
    mockSignIn.mockResolvedValue(null)

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: SPACE_EVENTS.SPACES_SIWE_SUCCESS.action }),
        expect.anything(),
      )
    })
  })
})

describe('SignInButton error messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWallet.mockReturnValue(defaultWallet)
    mockIsSmartContractWallet.mockResolvedValue(false)
    mockIsLedger.mockReturnValue(false)
    mockGetWalletConnectLabel.mockReturnValue(undefined)
  })

  it('shows smart contract wallet error with WalletConnect peer name', async () => {
    mockIsSmartContractWallet.mockResolvedValue(true)
    mockGetWalletConnectLabel.mockReturnValue('Safe{Wallet}')
    mockSignIn.mockRejectedValue(new Error('cannot sign'))

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/show',
        payload: expect.objectContaining({
          message: 'Safe{Wallet} is not supported for sign-in. Please use an EOA wallet.',
          variant: 'error',
        }),
      })
    })
  })

  it('shows smart contract wallet error with wallet label as fallback', async () => {
    mockIsSmartContractWallet.mockResolvedValue(true)
    mockGetWalletConnectLabel.mockReturnValue(undefined)
    mockSignIn.mockRejectedValue(new Error('cannot sign'))

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/show',
        payload: expect.objectContaining({
          message: 'MetaMask is not supported for sign-in. Please use an EOA wallet.',
          variant: 'error',
        }),
      })
    })
  })

  it('shows Ledger error when signing fails with a Ledger wallet', async () => {
    mockIsLedger.mockReturnValue(true)
    mockSignIn.mockRejectedValue(new Error('Ledger device error'))

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/show',
        payload: expect.objectContaining({
          message: 'Ledger signing is not supported. Please use a different wallet to sign in.',
          variant: 'error',
        }),
      })
    })
  })

  it('shows generic error for non-smart-contract, non-Ledger failures', async () => {
    mockSignIn.mockRejectedValue(new Error('network error'))

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/show',
        payload: expect.objectContaining({
          message: 'Something went wrong while trying to sign in',
          variant: 'error',
        }),
      })
    })
  })
})
