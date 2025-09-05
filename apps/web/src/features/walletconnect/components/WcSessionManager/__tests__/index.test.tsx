import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import WcSessionManager from '../index'
import { WalletConnectContext } from '@/features/walletconnect/WalletConnectContext'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { WalletKitTypes } from '@reown/walletkit'

// Mock analytics
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

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
