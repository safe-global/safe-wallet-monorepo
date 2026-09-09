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
    AUTH_LOGIN_SUCCEEDED: { action: 'Auth (SIWE / Email) success', category: 'spaces' },
    AUTH_LOGIN_FAILED: { action: 'Auth (SIWE / Email) failure', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@/services/siwe/useSiwe', () => ({
  useSiwe: () => ({ signIn: mockSignIn, loading: false }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth: { sessionExpiresAt: null } }),
}))

jest.mock('@/store/authSlice', () => ({
  setAuthenticated: (value: number) => ({ type: 'auth/setAuthenticated', payload: value }),
  SESSION_LIFETIME_MS: 24 * 60 * 60 * 1000,
  isAuthenticated: () => false,
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

  it('tracks AUTH_LOGIN_SUCCEEDED with spaceId and method sent to both GA (label) and Mixpanel (additionalParameters)', async () => {
    mockSignIn.mockResolvedValue({ token: 'abc' })

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenNthCalledWith(
        2,
        { ...SPACE_EVENTS.AUTH_LOGIN_SUCCEEDED, label: '42' },
        expect.objectContaining({ spaceId: '42', method: 'siwe' }),
      )
    })
  })

  it('tracks AUTH_LOGIN_FAILED with failure_reason on sign in error', async () => {
    const error = new Error('User rejected')
    mockSignIn.mockRejectedValue(error)

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.AUTH_LOGIN_FAILED, {
        'Failure Reason': 'User rejected',
        method: 'siwe',
      })
    })
  })

  it('tracks AUTH_LOGIN_FAILED when signIn returns an error object', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Signature failed') })

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.AUTH_LOGIN_FAILED, {
        'Failure Reason': 'Signature failed',
        method: 'siwe',
      })
    })
  })

  it('does not track AUTH_LOGIN_SUCCEEDED when signIn returns null', async () => {
    mockSignIn.mockResolvedValue(null)

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: SPACE_EVENTS.AUTH_LOGIN_SUCCEEDED.action }),
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
          message: 'Safe{Wallet} for logging into workspace is not supported at the moment.',
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
          message: 'MetaMask for logging into workspace is not supported at the moment.',
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
          message: 'Ledger for logging into workspace is not supported at the moment.',
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
