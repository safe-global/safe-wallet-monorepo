import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { MixPanelEventParams } from '@/services/analytics/mixpanel-events'
import SwapButton from '../index'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  MixPanelEventParams: {
    ENTRY_POINT: 'Entry Point',
  },
}))

jest.mock('@/components/common/CheckWallet', () => {
  return function MockCheckWallet({ children }: { children: (isOk: boolean) => React.ReactNode }) {
    return <>{children(true)}</>
  }
})

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

const mockTokenInfo = {
  address: '0x123',
  name: 'Test Token',
  symbol: 'TEST',
  decimals: 18,
  type: TokenType.ERC20,
  logoUri: '',
  trusted: true,
}

describe('SwapButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track NATIVE_SWAP_VIEWED event when button is clicked with Assets entry point', () => {
    render(<SwapButton tokenInfo={mockTokenInfo} amount="100" trackingLabel={SWAP_LABELS.asset} />)

    const swapButton = screen.getByText('Swap')
    fireEvent.click(swapButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...SWAP_EVENTS.OPEN_SWAPS, label: SWAP_LABELS.asset },
      {
        [MixPanelEventParams.ENTRY_POINT]: 'Assets',
      },
    )
  })

  it('should track NATIVE_SWAP_VIEWED event when button is clicked with Home entry point', () => {
    render(<SwapButton tokenInfo={mockTokenInfo} amount="100" trackingLabel={SWAP_LABELS.dashboard_assets} />)

    const swapButton = screen.getByText('Swap')
    fireEvent.click(swapButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...SWAP_EVENTS.OPEN_SWAPS, label: SWAP_LABELS.dashboard_assets },
      {
        [MixPanelEventParams.ENTRY_POINT]: 'Home',
      },
    )
  })

  it('should map different tracking labels to correct entry points', () => {
    const testCases = [
      { label: SWAP_LABELS.home, expected: 'Home' },
      { label: SWAP_LABELS.assets, expected: 'Assets' },
      { label: SWAP_LABELS.asset, expected: 'Assets' },
      { label: SWAP_LABELS.dashboard_assets, expected: 'Home' },
      { label: SWAP_LABELS.sidebar, expected: 'Sidebar' },
      { label: SWAP_LABELS.newTransaction, expected: 'New Transaction' },
    ]

    testCases.forEach(({ label, expected }) => {
      const { unmount } = render(<SwapButton tokenInfo={mockTokenInfo} amount="100" trackingLabel={label} />)

      const swapButton = screen.getByTestId('swap-btn')
      fireEvent.click(swapButton)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        { ...SWAP_EVENTS.OPEN_SWAPS, label },
        {
          [MixPanelEventParams.ENTRY_POINT]: expected,
        },
      )

      mockTrackEvent.mockClear()
      unmount()
    })
  })
})
