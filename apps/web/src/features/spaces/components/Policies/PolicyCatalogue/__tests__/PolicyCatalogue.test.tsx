import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
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

  it('renders the four tiles in the designed order, Spending limit first', () => {
    render(<PolicyCatalogue />)

    const tiles = screen.getAllByRole('button')

    expect(tiles).toHaveLength(4)
    expect(within(tiles[0]).getByText('Spending limit')).toBeInTheDocument()
    expect(within(tiles[1]).getByText('Proposer')).toBeInTheDocument()
    expect(within(tiles[2]).getByText('Account recovery')).toBeInTheDocument()
    expect(within(tiles[3]).getByText('Something missing?')).toBeInTheDocument()
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

    expect(screen.getByRole('button', { name: /Spending limit/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /Account recovery/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /Proposer/ })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: /Something missing\?/ })).not.toHaveAttribute('aria-disabled')
  })

  it('tracks a click on an available tile', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogue />)

    await user.click(screen.getByRole('button', { name: /Proposer/ }))

    expect(mockTrackEvent).toHaveBeenCalledWith(POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, {
      [MixpanelEventParams.POLICY_TYPE]: 'proposer',
      [MixpanelEventParams.IS_AVAILABLE]: true,
    })
  })

  it('tracks a click on an unavailable tile', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogue />)

    await user.click(screen.getByRole('button', { name: /Spending limit/ }))

    expect(mockTrackEvent).toHaveBeenCalledWith(POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, {
      [MixpanelEventParams.POLICY_TYPE]: 'spending-limit',
      [MixpanelEventParams.IS_AVAILABLE]: false,
    })
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
})
