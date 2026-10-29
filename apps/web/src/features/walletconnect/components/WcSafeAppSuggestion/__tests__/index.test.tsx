import { useContext } from 'react'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { safeAppBuilder } from '@/tests/builders/walletConnect'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { WalletConnectContext } from '../../WalletConnectContext'
import { WCLoadingState } from '../../../types'
import type { SafeAppSuggestion } from '../../../hooks/useSafeAppSuggestion'
import WcSafeAppSuggestion from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const safeApp = safeAppBuilder().build()
const origin = 'https://app.example.org'

const suggestion = (overrides: Partial<SafeAppSuggestion> = {}): SafeAppSuggestion => ({
  status: 'shown',
  safeApp,
  optOut: false,
  setOptOut: jest.fn(),
  resolve: jest.fn(),
  decline: jest.fn(),
  ...overrides,
})

const handlers = {
  onOpenSafeApp: jest.fn(),
  onContinueWithWalletConnect: jest.fn(),
  onBrowseSafeApps: jest.fn(),
}

const WithContext = ({
  safeAppSuggestion = suggestion(),
  loading = null,
}: {
  safeAppSuggestion?: SafeAppSuggestion
  loading?: WCLoadingState | null
}) => {
  const context = useContext(WalletConnectContext)
  return (
    <WalletConnectContext.Provider value={{ ...context, loading, safeAppSuggestion }}>
      <WcSafeAppSuggestion safeApp={safeApp} origin={origin} {...handlers} />
    </WalletConnectContext.Provider>
  )
}

const resultEvent = (result: WcSafeAppSuggestionResult, optOut = false) => [
  expect.objectContaining({ ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: origin }),
  {
    [MixpanelEventParams.APP_URL]: origin,
    [MixpanelEventParams.SAFE_APP_NAME]: safeApp.name,
    [MixpanelEventParams.RESULT]: result,
    [MixpanelEventParams.OPT_OUT_TICKED]: optOut,
  },
]

describe('WcSafeAppSuggestion', () => {
  beforeEach(() => jest.clearAllMocks())

  it('names the Safe App and the verified origin', () => {
    render(<WithContext />)

    expect(screen.getByRole('heading', { name: new RegExp(`^${safeApp.name} runs inside`) })).toBeInTheDocument()
    expect(screen.getByText(origin)).toBeInTheDocument()
  })

  it('tracks the impression once', () => {
    const { rerender } = render(<WithContext />)
    rerender(<WithContext />)

    const impressions = (trackEvent as jest.Mock).mock.calls.filter(
      ([event]) => event.action === WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTED.action,
    )
    expect(impressions).toEqual([
      [
        expect.objectContaining({ action: WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTED.action, label: origin }),
        { [MixpanelEventParams.APP_URL]: origin, [MixpanelEventParams.SAFE_APP_NAME]: safeApp.name },
      ],
    ])
  })

  it.each([
    ['Open in Safe App Store', WcSafeAppSuggestionResult.OPENED_SAFE_APP, handlers.onOpenSafeApp],
    [
      'Continue with WalletConnect',
      WcSafeAppSuggestionResult.CONTINUED_WITH_WALLETCONNECT,
      handlers.onContinueWithWalletConnect,
    ],
    ['all reviewed apps', WcSafeAppSuggestionResult.BROWSED_STORE, handlers.onBrowseSafeApps],
  ])('tracks "%s" as %s and runs its action', (name, result, handler) => {
    render(<WithContext />)

    fireEvent.click(screen.getByRole('button', { name }))

    expect(trackEvent).toHaveBeenCalledWith(...resultEvent(result))
    expect(handler).toHaveBeenCalled()
  })

  it('reports a ticked opt-out with the result', () => {
    render(<WithContext safeAppSuggestion={suggestion({ optOut: true })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue with WalletConnect' }))

    expect(trackEvent).toHaveBeenCalledWith(
      ...resultEvent(WcSafeAppSuggestionResult.CONTINUED_WITH_WALLETCONNECT, true),
    )
  })

  it('offers the opt-out for this dApp only', () => {
    const setOptOut = jest.fn()
    render(<WithContext safeAppSuggestion={suggestion({ setOptOut })} />)

    expect(screen.getByText("Don't suggest this again for this dApp")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))

    expect(setOptOut).toHaveBeenCalledWith(true)
  })

  it('disables every choice, and tracks none, while a request is in flight', () => {
    render(<WithContext loading={WCLoadingState.APPROVE} />)

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
      fireEvent.click(button)
    }

    expect(trackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT.action }),
      expect.anything(),
    )
  })
})
