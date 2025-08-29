import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { MixPanelEventParams } from '@/services/analytics/mixpanel-events'
import { MakeASwapButton } from '../TxButton'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  MixPanelEventParams: {
    ENTRY_POINT: 'Entry Point',
  },
}))

jest.mock('@/features/swap/hooks/useIsSwapFeatureEnabled', () => ({
  __esModule: true,
  default: () => true,
}))

jest.mock('@/hooks/safe-apps/useTxBuilderApp', () => ({
  useTxBuilderApp: () => null,
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('MakeASwapButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track NATIVE_SWAP_VIEWED event when Swap tokens button is clicked', () => {
    render(<MakeASwapButton />)

    const swapButton = screen.getByRole('button', { name: /swap tokens/i })
    fireEvent.click(swapButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        ...SWAP_EVENTS.OPEN_SWAPS,
        label: SWAP_LABELS.newTransaction,
      }),
      {
        [MixPanelEventParams.ENTRY_POINT]: 'New Transaction',
      },
    )
  })

  it('should render swap button with correct text and icon', () => {
    render(<MakeASwapButton />)

    expect(screen.getByText('Swap tokens')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
