import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import PolicyCatalogue from '../index'
import { mockStarterPlan } from '../../mocks/plan'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('PolicyCatalogue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the four tiles in the designed order, Spending limit first', () => {
    render(<PolicyCatalogue />)

    const tiles = screen.getAllByRole('button')

    expect(tiles).toHaveLength(4)
    expect(within(tiles[0]).getByText('Spending limit')).toBeInTheDocument()
    expect(within(tiles[1]).getByText('Proposer')).toBeInTheDocument()
    expect(within(tiles[2]).getByText('Account recovery')).toBeInTheDocument()
    expect(within(tiles[3]).getByText('Something missing?')).toBeInTheDocument()
  })

  it('gives every tile a test id of its own', () => {
    render(<PolicyCatalogue />)

    expect(screen.getByTestId('policy-catalogue-tile-spending-limit')).toBeInTheDocument()
    expect(screen.getByTestId('policy-catalogue-tile-proposer')).toBeInTheDocument()
    expect(screen.getByTestId('policy-catalogue-tile-account-recovery')).toBeInTheDocument()
    expect(screen.getByTestId('policy-catalogue-tile-suggestion')).toBeInTheDocument()
  })

  it('describes what each policy does', () => {
    render(<PolicyCatalogue />)

    expect(screen.getByText('Let spenders access assets without collecting signatures.')).toBeInTheDocument()
    expect(screen.getByText('Let teammates without signing rights propose transactions.')).toBeInTheDocument()
    expect(
      screen.getByText('Choose a trusted Recoverer to recover your Safe account if you ever lose access.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Tell us which rules would help you manage your Safe accounts.')).toBeInTheDocument()
  })

  it('renders the mechanisms not yet shipped as unavailable rather than absent', () => {
    render(<PolicyCatalogue />)

    expect(screen.getByRole('button', { name: /Account recovery/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /Spending limit/ })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: /Proposer/ })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: /Something missing\?/ })).not.toHaveAttribute('aria-disabled')
  })

  it('tracks a click on an available tile', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogue />)

    await user.click(screen.getByRole('button', { name: /Proposer/ }))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: 'proposer' },
      {
        [MixpanelEventParams.POLICY_TYPE]: 'proposer',
        [MixpanelEventParams.IS_AVAILABLE]: true,
      },
    )
  })

  it('tracks a click on an unavailable tile', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogue />)

    await user.click(screen.getByRole('button', { name: /Account recovery/ }))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: 'account-recovery' },
      {
        [MixpanelEventParams.POLICY_TYPE]: 'account-recovery',
        [MixpanelEventParams.IS_AVAILABLE]: false,
      },
    )
  })

  it('opens the flow of an available tile', async () => {
    const onSelect = jest.fn()
    const { user } = renderWithUserEvent(<PolicyCatalogue onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /Proposer/ }))

    expect(onSelect).toHaveBeenCalledWith('proposer')
  })

  it('does not open a flow that has not shipped', async () => {
    const onSelect = jest.fn()
    const { user } = renderWithUserEvent(<PolicyCatalogue onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /Account recovery/ }))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('should, when locked, render a counter and a Set policy button on each policy tile', () => {
    render(<PolicyCatalogue locked={{ accountCounts: mockStarterPlan.accountCounts, onUpgrade: jest.fn() }} />)

    expect(screen.getAllByTestId('policy-account-count')).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: 'Set policy' })).toHaveLength(3)
  })

  it('should, when locked, leave the Something missing? tile as it is', () => {
    render(<PolicyCatalogue locked={{ accountCounts: mockStarterPlan.accountCounts, onUpgrade: jest.fn() }} />)

    const tile = screen.getByTestId('policy-catalogue-tile-suggestion')

    expect(tile).toHaveRole('button')
    expect(within(tile).queryByTestId('policy-account-count')).not.toBeInTheDocument()
  })

  it('should, when a locked tile is clicked, call onUpgrade and not onSelect', async () => {
    const onUpgrade = jest.fn()
    const onSelect = jest.fn()
    const { user } = renderWithUserEvent(
      <PolicyCatalogue onSelect={onSelect} locked={{ accountCounts: mockStarterPlan.accountCounts, onUpgrade }} />,
    )

    await user.click(within(screen.getByTestId('policy-catalogue-tile-proposer')).getByRole('button'))

    expect(onUpgrade).toHaveBeenCalledTimes(1)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('should, when the Something missing? tile is clicked while locked, call onSelect and not onUpgrade', async () => {
    const onUpgrade = jest.fn()
    const onSelect = jest.fn()
    const { user } = renderWithUserEvent(
      <PolicyCatalogue onSelect={onSelect} locked={{ accountCounts: mockStarterPlan.accountCounts, onUpgrade }} />,
    )

    await user.click(screen.getByTestId('policy-catalogue-tile-suggestion'))

    expect(onSelect).toHaveBeenCalledWith('suggestion')
    expect(onUpgrade).not.toHaveBeenCalled()
  })

  it('should, when a locked tile is clicked, still track the click', async () => {
    const { user } = renderWithUserEvent(
      <PolicyCatalogue locked={{ accountCounts: mockStarterPlan.accountCounts, onUpgrade: jest.fn() }} />,
    )

    await user.click(within(screen.getByTestId('policy-catalogue-tile-spending-limit')).getByRole('button'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: 'spending-limit' },
      { [MixpanelEventParams.POLICY_TYPE]: 'spending-limit', [MixpanelEventParams.IS_AVAILABLE]: true },
    )
  })
})
