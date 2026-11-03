import { useContext } from 'react'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { safeAppBuilder } from '@/tests/builders/walletConnect'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { WalletConnectContext } from '../../WalletConnectContext'
import { WCLoadingState } from '../../../types'
import WcSafeAppSuggestion, { type WcSafeAppSuggestionProps } from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const safeApp = safeAppBuilder().build()
const origin = 'https://app.example.org'

const handlers = {
  onRememberChange: jest.fn(),
  onOpenSafeApp: jest.fn(),
  onContinueWithWalletConnect: jest.fn(),
  onBrowseSafeApps: jest.fn(),
}

const WithContext = ({
  loading = null,
  ...props
}: Partial<WcSafeAppSuggestionProps> & { loading?: WCLoadingState | null }) => {
  const context = useContext(WalletConnectContext)
  return (
    <WalletConnectContext.Provider value={{ ...context, loading }}>
      <WcSafeAppSuggestion safeApp={safeApp} origin={origin} remember={false} {...handlers} {...props} />
    </WalletConnectContext.Provider>
  )
}

const resultEvent = (result: WcSafeAppSuggestionResult, remember = false) => [
  expect.objectContaining({ ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: origin }),
  {
    [MixpanelEventParams.APP_URL]: origin,
    [MixpanelEventParams.SAFE_APP_NAME]: safeApp.name,
    [MixpanelEventParams.RESULT]: result,
    [MixpanelEventParams.REMEMBER_CHOICE]: remember,
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

  it('reports a remembered choice with the result', () => {
    render(<WithContext remember />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Safe App Store' }))

    expect(trackEvent).toHaveBeenCalledWith(...resultEvent(WcSafeAppSuggestionResult.OPENED_SAFE_APP, true))
  })

  it('offers to remember the choice for this dApp only', () => {
    render(<WithContext />)

    expect(screen.getByText('Remember my choice for this dApp')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))

    expect(handlers.onRememberChange).toHaveBeenCalledWith(true)
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
