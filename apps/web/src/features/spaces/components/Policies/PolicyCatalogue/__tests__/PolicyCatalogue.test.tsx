import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { FEATURES } from '@safe-global/utils/utils/chains'
import PolicyCatalogue from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

const mockUsePlanGate = jest.fn()
jest.mock('../../../../hooks/usePlanGate', () => ({
  usePlanGate: (...args: unknown[]) => mockUsePlanGate(...args),
}))

const gate = (isBlocked: boolean, isLoading = false) => ({ isBlocked, isLoading, upgradeHref: '/spaces/plans' })

describe('PolicyCatalogue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePlanGate.mockReturnValue(gate(false))
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

  it('swaps the action of a policy the plan does not include for the Safe Pro upsell', () => {
    mockUsePlanGate.mockImplementation((flag: FEATURES) => gate(flag === FEATURES.SPENDING_LIMIT_GATING))

    render(<PolicyCatalogue />)

    expect(mockUsePlanGate).toHaveBeenCalledWith(FEATURES.SPENDING_LIMIT_GATING)
    expect(mockUsePlanGate).toHaveBeenCalledWith(FEATURES.PROPOSER_GATING)
    expect(screen.queryByRole('button', { name: 'Set policy: Spending limit' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore Safe Pro: Spending limit' })).toHaveAttribute(
      'href',
      '/spaces/plans',
    )
    expect(screen.getByRole('button', { name: 'Set policy: Proposer' })).toBeEnabled()
  })

  it('disables a gated action until the plan is known', () => {
    mockUsePlanGate.mockReturnValue(gate(false, true))

    render(<PolicyCatalogue />)

    expect(screen.getByRole('button', { name: 'Set policy: Spending limit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Set policy: Proposer' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Give feedback: Something missing?' })).toBeEnabled()
  })
})
