import type { CowSwapWidgetParams } from '@cowprotocol/widget-lib'
import {
  CowWidgetEvents,
  ToastMessageType,
  type CowWidgetEventListeners,
  type CowWidgetEventPayloadMap,
  type OnTradeParamsPayload,
} from '@cowprotocol/events'
import { UiOrderType } from '@cowprotocol/types'
import { OrderKind } from '@cowprotocol/cow-sdk'
import { faker } from '@faker-js/faker'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { act, render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { mockChainId, mockHasFeature, mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import SwapWidget from '.'

jest.mock('@cowprotocol/widget-react', () => ({
  CowSwapWidget: jest.fn(() => <div data-testid="cow-swap-widget" />),
}))
jest.mock('@/hooks/safe-apps/useCustomAppCommunicator')
jest.mock('@/features/swap/useSwapConsent')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
}))
jest.mock('@/store/api/ofac', () => ({
  ...jest.requireActual('@/store/api/ofac'),
  useGetIsSanctionedQuery: jest.fn(),
}))

const mockCowSwapWidget = jest.requireMock('@cowprotocol/widget-react').CowSwapWidget as jest.Mock
const mockUseGetIsSanctionedQuery = jest.requireMock('@/store/api/ofac').useGetIsSanctionedQuery as jest.Mock
const mockUseSwapConsent = jest.requireMock('@/features/swap/useSwapConsent').default as jest.Mock
const acceptConsent = jest.fn()

type WidgetProps = { params: CowSwapWidgetParams; listeners: CowWidgetEventListeners }

const giveConsent = (isConsentAccepted: boolean) => {
  mockUseSwapConsent.mockReturnValue({ isConsentAccepted, onAccept: acceptConsent })
}

const sanction = (...addresses: string[]) => {
  mockUseGetIsSanctionedQuery.mockImplementation((address: string) => ({ data: addresses.includes(address) }))
}

const widgetProps = (): WidgetProps => mockCowSwapWidget.mock.lastCall?.[0]

const emit = <E extends CowWidgetEvents>(event: E, payload: CowWidgetEventPayloadMap[E]) => {
  const listener = widgetProps().listeners.find((candidate) => candidate.event === event)
  const handler = listener?.handler as ((payload: CowWidgetEventPayloadMap[E]) => void) | undefined
  act(() => handler?.(payload))
}

const LatestNotification = () => {
  const notifications = useAppSelector(selectNotifications)
  return <span data-testid="latest-notification">{notifications.at(-1)?.title}</span>
}

const renderAcceptedWidget = () => {
  giveConsent(true)
  render(
    <>
      <SwapWidget />
      <LatestNotification />
    </>,
  )
}

const tradeParams = (overrides: Partial<OnTradeParamsPayload> = {}): OnTradeParamsPayload => ({
  orderType: UiOrderType.LIMIT,
  orderKind: OrderKind.SELL,
  sellToken: { address: faker.finance.ethereumAddress() } as OnTradeParamsPayload['sellToken'],
  buyToken: { address: faker.finance.ethereumAddress() } as OnTradeParamsPayload['buyToken'],
  sellTokenFiatAmount: '1000000',
  buyTokenFiatAmount: '1000000',
  ...overrides,
})

describe('SwapWidget', () => {
  let safeAddress: string
  let walletAddress: string

  beforeEach(() => {
    jest.clearAllMocks()
    giveConsent(false)
    safeAddress = mockSafeInfo().address.value
    walletAddress = mockWallet()!.address
    mockChainId('1')
    mockHasFeature({ [FEATURES.NATIVE_SWAPS_FEE_ENABLED]: true })
    sanction()
  })

  describe('gates', () => {
    it('shows the disclaimer instead of the widget before the user accepts it', async () => {
      const { user } = renderWithUserEvent(<SwapWidget />)

      await user.click(screen.getByRole('button', { name: 'Continue' }))

      expect(acceptConsent).toHaveBeenCalled()
      expect(screen.queryByTestId('cow-swap-widget')).not.toBeInTheDocument()
    })

    it('shows the widget once the user has accepted the disclaimer', () => {
      renderAcceptedWidget()

      expect(screen.getByTestId('cow-swap-widget')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
    })

    it.each(['Safe', 'wallet'] as const)('blocks swaps for a sanctioned %s', (owner) => {
      const blocked = owner === 'Safe' ? safeAddress : walletAddress
      sanction(blocked)

      render(<SwapWidget />)

      expect(screen.getByText('Blocked address')).toBeInTheDocument()
      expect(screen.getByText(blocked)).toBeInTheDocument()
      expect(screen.queryByTestId('cow-swap-widget')).not.toBeInTheDocument()
    })

    it('blocks swaps once the user picks a sanctioned recipient in the widget', () => {
      const recipient = faker.finance.ethereumAddress()
      sanction(recipient)
      renderAcceptedWidget()

      emit(CowWidgetEvents.ON_CHANGE_TRADE_PARAMS, tradeParams({ recipient }))

      expect(screen.getByText('Blocked address')).toBeInTheDocument()
      expect(screen.getByText(recipient)).toBeInTheDocument()
      expect(screen.queryByTestId('cow-swap-widget')).not.toBeInTheDocument()
    })
  })

  describe('widget events', () => {
    it.each([
      { messageType: ToastMessageType.ORDER_CREATED, title: 'Order created' },
      { messageType: ToastMessageType.ORDER_PRESIGNED, title: 'Order transaction confirmed' },
      { messageType: ToastMessageType.ORDER_FULFILLED, title: 'Order executed' },
      { messageType: ToastMessageType.ORDER_EXPIRED, title: 'Order expired' },
      { messageType: ToastMessageType.ORDER_CANCELLED, title: 'Order cancelled' },
    ] as const)('notifies "$title" after a $messageType toast for a created order', ({ messageType, title }) => {
      const data = { orderUid: faker.string.hexadecimal({ length: 112 }), orderType: UiOrderType.SWAP }
      renderAcceptedWidget()

      emit(CowWidgetEvents.ON_TOAST_MESSAGE, { messageType: ToastMessageType.ORDER_CREATED, message: '', data })
      emit(CowWidgetEvents.ON_TOAST_MESSAGE, { messageType, message: '', data })

      expect(screen.getByTestId('latest-notification')).toHaveTextContent(title)
    })

    it('recomputes the fee and keeps the trade when the trade params change', () => {
      const params = tradeParams()
      renderAcceptedWidget()

      emit(CowWidgetEvents.ON_CHANGE_TRADE_PARAMS, params)

      expect(widgetProps().params).toMatchObject({
        tradeType: 'limit',
        partnerFee: { bps: 10 },
        sell: { asset: params.sellToken?.address },
        buy: { asset: params.buyToken?.address },
      })
    })

    it('charges no fee after a trade change when the fee flag is off', () => {
      mockHasFeature(false)
      renderAcceptedWidget()

      emit(CowWidgetEvents.ON_CHANGE_TRADE_PARAMS, tradeParams())

      expect(widgetProps().params.partnerFee?.bps).toBe(0)
    })
  })
})
