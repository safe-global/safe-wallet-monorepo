import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import WcSessionManager from '../index'
import { WalletConnectContext } from '../../WalletConnectContext'
import { trackEvent, trackSafeAppEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { SAFE_APPS_EVENTS } from '@/services/analytics/events/safeApps'
import { MixpanelEventParams, SafeAppLaunchLocation } from '@/services/analytics/mixpanel-events'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

const mockRouterPush = jest.fn()

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

const mockIsSafeAppSuggested = jest.fn(() => false)
const mockSetSuggestionDismissed = jest.fn()
jest.mock('../../../hooks/useSafeAppSuggestion', () => ({
  useIsSafeAppSuggested: () => mockIsSafeAppSuggested(),
  useSafeAppSuggestionDismissed: () => [undefined, mockSetSuggestionDismissed],
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>
const mockTrackSafeAppEvent = trackSafeAppEvent as jest.MockedFunction<typeof trackSafeAppEvent>

const mockSafeApp: SafeAppData = {
  id: 42,
  url: 'https://test-dapp.com',
  name: 'Test dApp Safe App',
  description: 'A Safe App',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: ['defi'],
  features: [],
  socialProfiles: [],
  featured: false,
}

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
  matchingSafeApp: undefined,
  isMatchingSafeAppLoading: false,
  isSuggestionResolved: false,
  setSuggestionResolved: jest.fn(),
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
          [MixpanelEventParams.SAFE_APP_AVAILABLE]: false,
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
          [MixpanelEventParams.SAFE_APP_AVAILABLE]: false,
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
  // isSuggestionResolved lives in the context, so the provider has to hold real state for
  // the fall-through to the connection form to be exercised
  const StatefulSuggestionHarness = () => {
    const [isSuggestionResolved, setSuggestionResolved] = useState(false)

    return (
      <WalletConnectContext.Provider
        value={{
          ...mockContextValue,
          matchingSafeApp: mockSafeApp,
          isSuggestionResolved,
          setSuggestionResolved,
        }}
      >
        <WcSessionManager uri="test-uri" />
      </WalletConnectContext.Provider>
    )
  }

  const renderWithSafeApp = () => render(<StatefulSuggestionHarness />)

  beforeEach(() => {
    jest.clearAllMocks()
    mockApproveSession.mockResolvedValue(undefined)
    mockRejectSession.mockResolvedValue(undefined)
    mockIsSafeAppSuggested.mockReturnValue(true)
    mockSetSuggestionDismissed.mockClear()
  })

  it('shows the suggestion instead of the connection form', () => {
    renderWithSafeApp()

    expect(
      screen.getByRole('heading', { name: new RegExp(`${mockSafeApp.name} runs inside`, 'i') }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('tracks the impression once', () => {
    renderWithSafeApp()

    const impressions = mockTrackEvent.mock.calls.filter(
      ([event]) => event.action === WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTED.action,
    )
    expect(impressions).toHaveLength(1)
  })

  it('rejects the proposal and navigates to the Safe App', async () => {
    renderWithSafeApp()

    fireEvent.click(screen.getByRole('button', { name: /open .* in safe app store/i }))

    await waitFor(() => {
      expect(mockRejectSession).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining(`appUrl=${encodeURIComponent(mockSafeApp.url)}`),
      )
    })

    // Opening the Safe App must not be counted as a rejection
    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: WALLETCONNECT_EVENTS.REJECT_CLICK.action }),
    )
  })

  it('tracks the Opened Safe App result and the Safe App launch', async () => {
    renderWithSafeApp()

    fireEvent.click(screen.getByRole('button', { name: /open .* in safe app store/i }))

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: 'https://test-dapp.com' },
        expect.objectContaining({
          [MixpanelEventParams.SAFE_APP_NAME]: mockSafeApp.name,
          [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.OPENED_SAFE_APP,
          [MixpanelEventParams.SUGGESTION_DISMISSED]: false,
        }),
      )
    })

    expect(mockTrackSafeAppEvent).toHaveBeenCalledWith(
      { ...SAFE_APPS_EVENTS.OPEN_APP, label: mockSafeApp.name },
      mockSafeApp,
      { launchLocation: SafeAppLaunchLocation.WC_PROPOSAL },
    )
  })

  it('connects straight away, without a second dialog', async () => {
    renderWithSafeApp()

    fireEvent.click(screen.getByRole('button', { name: /continue with walletconnect/i }))

    // Connects off the single click, with no second dialog to confirm through
    await waitFor(() => {
      expect(mockApproveSession).toHaveBeenCalledTimes(1)
    })

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: 'https://test-dapp.com' },
      expect.objectContaining({
        [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.CONTINUED_WITH_WALLETCONNECT,
      }),
    )
    expect(mockSetSuggestionDismissed).not.toHaveBeenCalled()
  })

  it('persists the dismissal when Don’t show again is ticked', async () => {
    renderWithSafeApp()

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /continue with walletconnect/i }))

    await waitFor(() => {
      expect(mockSetSuggestionDismissed).toHaveBeenCalledWith(true)
    })

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: 'https://test-dapp.com' },
      expect.objectContaining({ [MixpanelEventParams.SUGGESTION_DISMISSED]: true }),
    )
  })

  it('flags Safe App availability on connect', async () => {
    renderWithSafeApp()

    fireEvent.click(screen.getByRole('button', { name: /continue with walletconnect/i }))

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        { ...WALLETCONNECT_EVENTS.CONNECTED, label: 'https://test-dapp.com' },
        expect.objectContaining({ [MixpanelEventParams.SAFE_APP_AVAILABLE]: true }),
      )
    })
  })

  it('renders the Safe App icon from the registry', () => {
    renderWithSafeApp()

    expect(screen.getByAltText(`${mockSafeApp.name} logo`)).toHaveAttribute('src', mockSafeApp.iconUrl)
  })

  // A missing icon must still leave the placeholder in place rather than collapse the layout
  it('falls back to a placeholder when the app has no icon', () => {
    render(
      <WalletConnectContext.Provider
        value={{ ...mockContextValue, matchingSafeApp: { ...mockSafeApp, iconUrl: null } }}
      >
        <WcSessionManager uri="test-uri" />
      </WalletConnectContext.Provider>,
    )

    expect(screen.getByAltText(`${mockSafeApp.name} logo`)).toHaveAttribute('src', '/images/apps/app-placeholder.svg')
  })

  it('shows the verified origin so the user knows who they would connect to', () => {
    renderWithSafeApp()

    expect(screen.getByText('https://test-dapp.com')).toBeInTheDocument()
  })

  // Regression: the connection form used to render while the lookup was in flight, and could
  // be approved in the moment before the suggestion replaced it
  it('does not show the connection form while the Safe App lookup is in flight', () => {
    render(
      <WalletConnectContext.Provider
        value={{ ...mockContextValue, matchingSafeApp: undefined, isMatchingSafeAppLoading: true }}
      >
        <WcSessionManager uri="test-uri" />
      </WalletConnectContext.Provider>,
    )

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('rejects the proposal and navigates when browsing the store', async () => {
    renderWithSafeApp()

    fireEvent.click(screen.getByRole('button', { name: /60\+ reviewed apps/i }))

    await waitFor(() => {
      expect(mockRejectSession).toHaveBeenCalled()
    })

    expect(mockRouterPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/apps' }))
    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: 'https://test-dapp.com' },
      expect.objectContaining({ [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.DISMISSED }),
    )
  })

  it('shows the connection form directly when the suggestion is not eligible', () => {
    mockIsSafeAppSuggested.mockReturnValue(false)

    renderWithSafeApp()

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTED.action }),
      expect.anything(),
    )
  })
})
