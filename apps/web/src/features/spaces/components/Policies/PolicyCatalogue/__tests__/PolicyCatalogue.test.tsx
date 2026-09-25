import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import PolicyCatalogue from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('PolicyCatalogue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the three tiles in the designed order, Spending limit first', () => {
    render(<PolicyCatalogue />)

    const buttons = screen.getAllByRole('button')

    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveAccessibleName('Set policy: Spending limit')
    expect(buttons[1]).toHaveAccessibleName('Set policy: Proposer')
    expect(buttons[2]).toHaveAccessibleName('Give feedback: Something missing?')
  })

  it('gives every tile a test id of its own', () => {
    render(<PolicyCatalogue />)

    expect(screen.getByTestId('policy-catalogue-tile-spending-limit')).toBeInTheDocument()
    expect(screen.getByTestId('policy-catalogue-tile-proposer')).toBeInTheDocument()
    expect(screen.getByTestId('policy-catalogue-tile-suggestion')).toBeInTheDocument()
  })

  it('describes what each policy does', () => {
    render(<PolicyCatalogue />)

    expect(screen.getByText('Let spenders access assets without collecting signatures.')).toBeInTheDocument()
    expect(screen.getByText('Let teammates without signing rights propose transactions.')).toBeInTheDocument()
    expect(screen.getByText('Tell us which rules would help you manage your Safe accounts.')).toBeInTheDocument()
  })

  it('tracks a click on a tile', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogue />)

    await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: 'proposer' },
      { [MixpanelEventParams.POLICY_TYPE]: 'proposer' },
    )
  })

  it('opens the flow of the clicked tile', async () => {
    const onSelect = jest.fn()
    const { user } = renderWithUserEvent(<PolicyCatalogue onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

    expect(onSelect).toHaveBeenCalledWith('proposer')
  })

  it('should, when the feedback tile is clicked, report the suggestion id', async () => {
    const onSelect = jest.fn()
    const { user } = renderWithUserEvent(<PolicyCatalogue onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: 'Give feedback: Something missing?' }))

    expect(onSelect).toHaveBeenCalledWith('suggestion')
  })
})
