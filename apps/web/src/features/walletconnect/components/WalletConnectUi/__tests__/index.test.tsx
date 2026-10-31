import { useContext } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import { faker } from '@faker-js/faker'
import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import WalletConnectUi from '../index'
import { WalletConnectContext } from '../../WalletConnectContext'
import WalletConnectWallet from '../../../services/WalletConnectWallet'
import { wcPopupStore } from '../../../store/wcPopupStore'
import * as useLocalStorageHook from '@/services/local-storage/useLocalStorage'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { safeAppBuilder } from '@/tests/builders/walletConnect'
import * as useSafeAppSuggestionHook from '../../../hooks/useSafeAppSuggestion'
import type { SafeAppSuggestion } from '../../../hooks/useSafeAppSuggestion'

jest.mock('@reown/walletkit', () => jest.fn())
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))
jest.mock('@/services/safe-wallet-provider/useSafeWalletProvider')

jest.mock('../../../store/wcPopupStore', () => ({
  wcPopupStore: { useStore: jest.fn(), setStore: jest.fn() },
  openWalletConnect: jest.fn(),
}))

jest.mock('../../WcSessionManager', () => ({
  __esModule: true,
  default: function SessionManagerStub() {
    const { sessionProposal, approveSession, error } = useContext(WalletConnectContext)
    return (
      <>
        {sessionProposal && <button onClick={() => approveSession()}>Approve</button>}
        {error && <p>{error.message}</p>}
      </>
    )
  },
}))

const proposal = {
  id: faker.number.int({ min: 1, max: 999999 }),
  verifyContext: { verified: { validation: 'VALID', origin: faker.internet.url(), isScam: false } },
} as WalletKitTypes.SessionProposal

const safeInfo = extendedSafeInfoBuilder()
  .with({ address: addressExBuilder().with({ value: faker.finance.ethereumAddress() }).build(), chainId: '5' })
  .build()

const closePopup = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })

describe('WalletConnectUi', () => {
  let propose: (proposal: WalletKitTypes.SessionProposal) => void

  beforeEach(() => {
    jest.restoreAllMocks()
    ;(wcPopupStore.useStore as jest.Mock).mockReturnValue(true)
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([{}, jest.fn()])
    jest.spyOn(WalletConnectWallet.prototype, 'init').mockResolvedValue(undefined)
    jest.spyOn(WalletConnectWallet.prototype, 'updateSessions').mockResolvedValue(undefined)
    jest.spyOn(WalletConnectWallet.prototype, 'getActiveSessions').mockReturnValue([])
    jest.spyOn(WalletConnectWallet.prototype, 'rejectSession').mockResolvedValue(undefined)
    jest.spyOn(WalletConnectWallet.prototype, 'onSessionPropose').mockImplementation((callback) => {
      propose = callback
      return jest.fn()
    })
  })

  const renderUi = async () => {
    render(<WalletConnectUi />, {
      initialReduxState: { safeInfo: { loading: false, loaded: true, data: safeInfo } },
    })
    await waitFor(() => expect(WalletConnectWallet.prototype.onSessionPropose).toHaveBeenCalled())
  }

  it('rejects a pending proposal when the popup is closed', async () => {
    await renderUi()
    act(() => propose(proposal))

    closePopup()

    await waitFor(() => expect(WalletConnectWallet.prototype.rejectSession).toHaveBeenCalledWith(proposal))
    expect(wcPopupStore.setStore).toHaveBeenCalledWith(false)
  })

  it('shows the error when rejecting on close fails', async () => {
    jest.spyOn(WalletConnectWallet.prototype, 'rejectSession').mockRejectedValue(new Error('Relay unavailable'))
    await renderUi()
    act(() => propose(proposal))

    closePopup()

    expect(await screen.findByText('Relay unavailable')).toBeInTheDocument()
  })

  it('does not reject a proposal that is being approved', async () => {
    jest.spyOn(WalletConnectWallet.prototype, 'approveSession').mockReturnValue(new Promise(() => {}))
    await renderUi()
    act(() => propose(proposal))

    fireEvent.click(screen.getByText('Approve'))
    closePopup()

    expect(WalletConnectWallet.prototype.rejectSession).not.toHaveBeenCalled()
  })

  it('only closes the popup when there is no proposal', async () => {
    await renderUi()

    closePopup()

    expect(wcPopupStore.setStore).toHaveBeenCalledWith(false)
    expect(WalletConnectWallet.prototype.rejectSession).not.toHaveBeenCalled()
  })

  describe('with a Safe App suggestion', () => {
    const safeApp = safeAppBuilder().build()
    const mockDecline = jest.fn()

    beforeEach(() => jest.clearAllMocks())

    const mockSuggestion = (status: SafeAppSuggestion['status']) =>
      jest.spyOn(useSafeAppSuggestionHook, 'useSafeAppSuggestion').mockReturnValue({
        status,
        safeApp,
        optOut: true,
        setOptOut: jest.fn(),
        resolve: jest.fn(),
        decline: mockDecline,
      })

    it('records the dismissal and declines the suggestion when the popup is closed', async () => {
      mockSuggestion('shown')
      await renderUi()
      act(() => propose(proposal))

      closePopup()

      const origin = proposal.verifyContext.verified.origin
      expect(trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT.action, label: origin }),
        {
          [MixpanelEventParams.APP_URL]: origin,
          [MixpanelEventParams.SAFE_APP_NAME]: safeApp.name,
          [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.DISMISSED,
          [MixpanelEventParams.OPT_OUT_TICKED]: true,
        },
      )
      expect(mockDecline).toHaveBeenCalled()
      await waitFor(() => expect(WalletConnectWallet.prototype.rejectSession).toHaveBeenCalledWith(proposal))
    })

    it('records no dismissal when the suggestion is not on screen', async () => {
      mockSuggestion('none')
      await renderUi()
      act(() => propose(proposal))

      closePopup()

      await waitFor(() => expect(WalletConnectWallet.prototype.rejectSession).toHaveBeenCalled())
      expect(trackEvent).not.toHaveBeenCalled()
      expect(mockDecline).not.toHaveBeenCalled()
    })
  })
})
