import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { createContext } from 'react'
import type { ReactNode } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import WalletConnectUi from '../index'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1' }, safeLoaded: true }),
}))

jest.mock('../../../hooks/useWcUri', () => ({
  __esModule: true,
  default: () => ['', jest.fn()],
}))

const mockIsSafeAppSuggested = jest.fn(() => false)
jest.mock('../../../hooks/useSafeAppSuggestion', () => ({
  useIsSafeAppSuggested: () => mockIsSafeAppSuggested(),
  useSafeAppSuggestionDismissed: () => [undefined, jest.fn()],
}))

// The popup is replaced with a bare close button so the dismissal can be triggered directly
jest.mock('../../WcHeaderWidget', () => ({
  __esModule: true,
  default: ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
    <div>
      <button onClick={onClose}>close popup</button>
      {children}
    </div>
  ),
}))

jest.mock('../../WcSessionManager', () => ({
  __esModule: true,
  default: () => <div>session manager</div>,
}))

const mockRejectSession = jest.fn()
const mockSetOpen = jest.fn()

const mockSafeApp: SafeAppData = {
  id: 1,
  url: 'https://test-dapp.com',
  name: 'Test App',
  description: '',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: [],
  features: [],
  socialProfiles: [],
  featured: false,
}

const mockSessionProposal = {
  id: 1,
  params: {
    proposer: {
      publicKey: 'k',
      metadata: { name: 'Test dApp', description: '', url: 'https://test-dapp.com', icons: [] },
    },
    requiredNamespaces: {},
    optionalNamespaces: {},
  },
  verifyContext: { verified: { validation: 'VALID', origin: 'https://test-dapp.com', verifyUrl: '', isScam: false } },
} as unknown as WalletKitTypes.SessionProposal

const contextValue = {
  walletConnect: null,
  sessions: [],
  sessionProposal: null as WalletKitTypes.SessionProposal | null,
  error: null,
  setError: jest.fn(),
  open: true,
  setOpen: mockSetOpen,
  loading: null,
  setLoading: jest.fn(),
  approveSession: jest.fn(),
  rejectSession: mockRejectSession,
  matchingSafeApp: undefined as SafeAppData | undefined,
  isMatchingSafeAppLoading: false,
  isSuggestionResolved: false,
  setSuggestionResolved: jest.fn(),
}

let currentContext = { ...contextValue }

// A real context so useContext resolves through React as it does in the app, rather than
// being stubbed out globally
const TestContext = createContext(contextValue)

jest.mock('../../WalletConnectContext', () => ({
  get WalletConnectContext() {
    return TestContext
  },
  WalletConnectProvider: ({ children }: { children: ReactNode }) => (
    <TestContext.Provider value={currentContext}>{children}</TestContext.Provider>
  ),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('WalletConnectUi dismissal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRejectSession.mockResolvedValue(undefined)
    currentContext = { ...contextValue }
    mockIsSafeAppSuggested.mockReturnValue(false)
  })

  it('does not reject anything when there is no pending proposal', () => {
    render(<WalletConnectUi />)

    fireEvent.click(screen.getByText('close popup'))

    expect(mockSetOpen).toHaveBeenCalledWith(false)
    expect(mockRejectSession).not.toHaveBeenCalled()
  })

  // Regression: closing the popup used to leave the dApp waiting until the proposal expired
  it('rejects a pending proposal when the popup is closed', async () => {
    currentContext = { ...contextValue, sessionProposal: mockSessionProposal }

    render(<WalletConnectUi />)

    fireEvent.click(screen.getByText('close popup'))

    expect(mockSetOpen).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expect(mockRejectSession).toHaveBeenCalled()
    })

    expect(mockTrackEvent).toHaveBeenCalledWith({
      ...WALLETCONNECT_EVENTS.REJECT_CLICK,
      label: 'https://test-dapp.com',
    })
  })

  it('records a Dismissed result when the suggestion was on screen', async () => {
    currentContext = { ...contextValue, sessionProposal: mockSessionProposal, matchingSafeApp: mockSafeApp }
    mockIsSafeAppSuggested.mockReturnValue(true)

    render(<WalletConnectUi />)

    fireEvent.click(screen.getByText('close popup'))

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: 'https://test-dapp.com' },
        expect.objectContaining({ [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.DISMISSED }),
      )
    })
  })

  it('does not double count once the user moved past the suggestion', async () => {
    currentContext = {
      ...contextValue,
      sessionProposal: mockSessionProposal,
      matchingSafeApp: mockSafeApp,
      isSuggestionResolved: true,
    }
    mockIsSafeAppSuggested.mockReturnValue(true)

    render(<WalletConnectUi />)

    fireEvent.click(screen.getByText('close popup'))

    await waitFor(() => {
      expect(mockRejectSession).toHaveBeenCalled()
    })

    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT.action }),
      expect.anything(),
    )
  })

  it('still closes when the rejection fails', async () => {
    currentContext = { ...contextValue, sessionProposal: mockSessionProposal }
    mockRejectSession.mockRejectedValue(new Error('This connection request has expired.'))

    render(<WalletConnectUi />)

    fireEvent.click(screen.getByText('close popup'))

    expect(mockSetOpen).toHaveBeenCalledWith(false)
    await waitFor(() => {
      expect(mockRejectSession).toHaveBeenCalled()
    })
  })
})
