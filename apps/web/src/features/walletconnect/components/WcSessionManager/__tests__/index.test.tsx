import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import WcSessionManager from '../index'
import { WalletConnectContext } from '../../WalletConnectContext'
import { trackEvent, trackSafeAppEvent } from '@/services/analytics'
import { SAFE_APPS_EVENTS } from '@/services/analytics/events/safeApps'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams, SafeAppLaunchLocation } from '@/services/analytics/mixpanel-events'
import { AppRoutes } from '@/config/routes'
import { safeAppBuilder } from '@/tests/builders/walletConnect'
import type { SafeAppSuggestion } from '../../../hooks/useSafeAppSuggestion'
import { safeAppSuggestionBuilder } from '../../../hooks/safeAppSuggestion.fixtures'
import type { WalletKitTypes } from '@reown/walletkit'

const mockRouterPush = jest.fn<Promise<boolean>, unknown[]>(() => Promise.resolve(true))
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    query: { safe: 'eth:0x1234567890123456789012345678901234567890' },
    asPath: '/',
    pathname: '/',
    isReady: true,
  }),
}))

// Mock analytics
jest.mock('@/services/analytics', () => {
  const actual = jest.requireActual('@/services/analytics')

  return {
    ...actual,
    trackEvent: jest.fn(),
    trackSafeAppEvent: jest.fn(),
  }
})

// Mock hooks
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      {
        chainId: '1',
        chainName: 'Ethereum',
        nativeCurrency: { symbol: 'ETH' },
      },
    ],
  }),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({
    safe: { chainId: '1' },
    safeLoaded: true,
  }),
}))

jest.mock('@/hooks/useSanctionedAddress', () => ({
  useSanctionedAddress: () => null,
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

// Mock the context and other dependencies
const mockApproveSession = jest.fn()
const mockRejectSession = jest.fn()
const mockSetError = jest.fn()

const mockSessionProposal: WalletKitTypes.SessionProposal = {
  id: 123,
  params: {
    id: 123,
    expiryTimestamp: Date.now() + 300000,
    pairingTopic: 'test-pairing-topic',
    proposer: {
      publicKey: 'test-public-key',
      metadata: {
        name: 'Test dApp',
        description: 'Test description',
        url: 'https://test-dapp.com',
        icons: ['https://test-dapp.com/icon.png'],
      },
    },
    requiredNamespaces: {
      eip155: {
        methods: ['eth_sendTransaction'],
        chains: ['eip155:1'],
        events: ['chainChanged'],
      },
    },
    optionalNamespaces: {},
    sessionProperties: {},
    relays: [{ protocol: 'irn' }],
  },
  verifyContext: {
    verified: {
      validation: 'VALID' as const,
      origin: 'https://test-dapp.com',
      verifyUrl: 'https://verify.walletconnect.com',
      isScam: false,
    },
  },
}

const mockContextValue = {
  walletConnect: null,
  sessions: [],
  sessionProposal: mockSessionProposal,
  error: null,
  setError: mockSetError,
  open: true,
  setOpen: jest.fn(),
  loading: null,
  setLoading: jest.fn(),
  approveSession: mockApproveSession,
  rejectSession: mockRejectSession,
  safeAppSuggestion: safeAppSuggestionBuilder().build(),
}

const WcSessionManagerWithContext = ({ uri = 'test-uri' }) => (
  <WalletConnectContext.Provider value={mockContextValue}>
    <WcSessionManager uri={uri} />
  </WalletConnectContext.Provider>
)

describe('WcSessionManager tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApproveSession.mockResolvedValue(undefined)
  })

  it('should track WC Connected event with App URL when session is approved', async () => {
    render(<WcSessionManagerWithContext />)

    const approveButton = screen.getByRole('button', { name: /approve/i })
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(mockApproveSession).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          ...WALLETCONNECT_EVENTS.CONNECTED,
          label: 'https://test-dapp.com',
        },
        {
          [MixpanelEventParams.APP_URL]: 'https://test-dapp.com',
        },
      )
    })
  })

  it('should not track WC Connected event when session approval fails', async () => {
    const error = new Error('Approval failed')
    mockApproveSession.mockRejectedValue(error)

    render(<WcSessionManagerWithContext />)

    const approveButton = screen.getByRole('button', { name: /approve/i })
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(error)
    })

    // Should track the approve click but not the WC Connected event
    expect(mockTrackEvent).toHaveBeenCalledWith({
      ...WALLETCONNECT_EVENTS.APPROVE_CLICK,
      label: 'https://test-dapp.com',
    })

    // Should not track the WC Connected event with additional parameters
    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      {
        ...WALLETCONNECT_EVENTS.CONNECTED,
        label: 'https://test-dapp.com',
      },
      {
        [MixpanelEventParams.APP_URL]: 'https://test-dapp.com',
      },
    )
  })

  it('should track event with correct App URL from session proposal metadata', async () => {
    const customSessionProposal = {
      ...mockSessionProposal,
      params: {
        ...mockSessionProposal.params,
        proposer: {
          ...mockSessionProposal.params.proposer,
          metadata: {
            ...mockSessionProposal.params.proposer.metadata,
            url: 'https://custom-dapp.example.com',
          },
        },
      },
      verifyContext: {
        verified: {
          validation: 'VALID' as const,
          origin: 'https://custom-dapp.example.com',
          verifyUrl: 'https://verify.walletconnect.com',
          isScam: false,
        },
      },
    }

    const customContextValue = {
      ...mockContextValue,
      sessionProposal: customSessionProposal,
    }

    render(
      <WalletConnectContext.Provider value={customContextValue}>
        <WcSessionManager uri="test-uri" />
      </WalletConnectContext.Provider>,
    )

    const approveButton = screen.getByRole('button', { name: /approve/i })
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          ...WALLETCONNECT_EVENTS.CONNECTED,
          label: 'https://custom-dapp.example.com',
        },
        {
          [MixpanelEventParams.APP_URL]: 'https://custom-dapp.example.com',
        },
      )
    })
  })

  it('should not track when there is no session proposal', async () => {
    const contextWithoutProposal = {
      ...mockContextValue,
      sessionProposal: null,
    }

    render(
      <WalletConnectContext.Provider value={contextWithoutProposal}>
        <WcSessionManager uri="test-uri" />
      </WalletConnectContext.Provider>,
    )

    // Should not render approval form without session proposal
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })
})

describe('WcSessionManager Safe App suggestion', () => {
  const safeApp = safeAppBuilder().with({ url: 'https://test-dapp.com' }).build()
  const origin = mockSessionProposal.verifyContext.verified.origin
  const mockRememberChoice = jest.fn()
  const mockSetOpen = jest.fn()

  const WithSuggestion = (overrides: Partial<SafeAppSuggestion>) => (
    <WalletConnectContext.Provider
      value={{
        ...mockContextValue,
        setOpen: mockSetOpen,
        safeAppSuggestion: safeAppSuggestionBuilder()
          .with({ safeApp, rememberChoice: mockRememberChoice, ...overrides })
          .build(),
      }}
    >
      <WcSessionManager uri="test-uri" />
    </WalletConnectContext.Provider>
  )

  const shown = { status: 'shown', isShown: true, blocksAutoApprove: true } as const

  beforeEach(() => {
    jest.clearAllMocks()
    mockApproveSession.mockResolvedValue(undefined)
    mockRejectSession.mockResolvedValue(undefined)
    mockRouterPush.mockResolvedValue(true)
  })

  it('shows a spinner, not an approvable form, while the Safe App lookup is in flight', () => {
    render(<WithSuggestion status="loading" />)

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('shows the suggestion instead of the connection form', () => {
    render(<WithSuggestion {...shown} />)

    expect(screen.getByRole('button', { name: 'Open in Safe App Store' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('shows the connection form when the suggestion does not apply', () => {
    render(<WithSuggestion status="none" />)

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
  })

  it('remembers WalletConnect for the dApp once the approval succeeds', async () => {
    let finishApproving: () => void = () => {}
    mockApproveSession.mockReturnValue(new Promise<void>((resolve) => (finishApproving = resolve)))
    render(<WithSuggestion {...shown} remember />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue with WalletConnect' }))
    expect(mockRememberChoice).not.toHaveBeenCalled()

    finishApproving()
    await waitFor(() => expect(mockRememberChoice).toHaveBeenCalledWith(origin, 'walletConnect'))
    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...WALLETCONNECT_EVENTS.CONNECTED, label: 'https://test-dapp.com' },
      { [MixpanelEventParams.APP_URL]: 'https://test-dapp.com', [MixpanelEventParams.SAFE_APP_AVAILABLE]: true },
    )
  })

  it('remembers nothing when the approval fails', async () => {
    mockApproveSession.mockRejectedValue(new Error('Approval failed'))
    render(<WithSuggestion {...shown} remember />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue with WalletConnect' }))

    await waitFor(() => expect(mockSetError).toHaveBeenCalled())
    expect(mockRememberChoice).not.toHaveBeenCalled()
  })

  it('rejects the proposal and opens the Safe App', async () => {
    render(<WithSuggestion {...shown} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Safe App Store' }))

    await waitFor(() => expect(trackSafeAppEvent).toHaveBeenCalled())
    expect(mockRejectSession).toHaveBeenCalled()
    expect(mockSetOpen).toHaveBeenCalledWith(false)
    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(safeApp.url)))
    expect(trackSafeAppEvent).toHaveBeenCalledWith({ ...SAFE_APPS_EVENTS.OPEN_APP, label: safeApp.name }, safeApp, {
      launchLocation: SafeAppLaunchLocation.WC_PROPOSAL,
    })
    expect(mockRememberChoice).not.toHaveBeenCalled()
  })

  it('remembers the Safe App for the dApp when the box is ticked', async () => {
    render(<WithSuggestion {...shown} remember />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Safe App Store' }))

    expect(mockRememberChoice).toHaveBeenCalledWith(origin, 'safeApp')
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalled())
  })

  it('shows no approvable form while it leaves for the Safe App', async () => {
    mockRejectSession.mockReturnValue(new Promise(() => {}))
    render(<WithSuggestion {...shown} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Safe App Store' }))

    await waitFor(() => expect(mockRejectSession).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('still opens the Safe App, and reports the error, when rejecting fails', async () => {
    const error = new Error('Relay unavailable')
    mockRejectSession.mockRejectedValue(error)
    render(<WithSuggestion {...shown} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Safe App Store' }))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalled())
    expect(mockSetError).toHaveBeenCalledWith(error)
  })

  it('records no Safe App launch when the navigation is cancelled', async () => {
    mockRouterPush.mockResolvedValue(false)
    render(<WithSuggestion {...shown} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Safe App Store' }))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalled())
    expect(trackSafeAppEvent).not.toHaveBeenCalled()
  })

  it('rejects the proposal and opens the Safe App Store without remembering a choice', async () => {
    render(<WithSuggestion {...shown} remember />)

    fireEvent.click(screen.getByRole('button', { name: 'all reviewed apps' }))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalled())
    expect(mockRejectSession).toHaveBeenCalled()
    expect(mockRememberChoice).not.toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: AppRoutes.apps.index }))
  })

  it('opens a remembered Safe App once, without showing the suggestion', async () => {
    const { rerender } = render(<WithSuggestion status="redirect" blocksAutoApprove />)

    expect(screen.queryByRole('button', { name: 'Open in Safe App Store' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()

    await waitFor(() => expect(trackSafeAppEvent).toHaveBeenCalled())
    rerender(<WithSuggestion status="redirect" blocksAutoApprove />)

    expect(mockRejectSession).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(safeApp.url)))
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT.action }),
      expect.objectContaining({ [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.OPENED_REMEMBERED_SAFE_APP }),
    )
  })
})
