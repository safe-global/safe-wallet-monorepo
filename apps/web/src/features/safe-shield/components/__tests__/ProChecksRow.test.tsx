import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { ProChecksRow } from '../ProChecksRow'

jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

let mockSpaceId: string | null = 'space-1'
const mockTrackPlanSelectionStarted = jest.fn()
jest.mock('@/features/spaces', () => ({
  useSafeProAccess: () => ({ hasProFeatures: false, isLoading: false, spaceId: mockSpaceId }),
  trackPlanSelectionStarted: (props: unknown) => mockTrackPlanSelectionStarted(props),
}))

describe('ProChecksRow', () => {
  it('tracks the upgrade prompt and its click only without Pro', () => {
    render(<ProChecksRow hasProFeatures />)
    expect(trackEvent).not.toHaveBeenCalled()

    render(<ProChecksRow hasProFeatures={false} />)
    fireEvent.click(screen.getByTestId('pro-upgrade-link'))
    const prompt = { Feature: 'safe_shield_checks', Location: 'tx_flow_safe_shield' }
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, prompt)
    expect(mockTrackPlanSelectionStarted).toHaveBeenCalledWith({ 'Entry Point': 'upgrade_prompt', ...prompt })
  })

  it('links to the plans of the Workspace holding the Safe when it has no Pro features', () => {
    render(<ProChecksRow hasProFeatures={false} />)

    expect(screen.getByLabelText('Safe Pro')).toBeInTheDocument()
    expect(screen.getByTestId('pro-upgrade-link')).toHaveAttribute('href', '/spaces/plans?spaceId=space-1')
    expect(screen.getByTestId('pro-upgrade-link')).toHaveTextContent('Upgrade')
  })

  it('falls back to the Workspaces list when no Workspace holds the Safe', () => {
    mockSpaceId = null
    render(<ProChecksRow hasProFeatures={false} />)

    expect(screen.getByTestId('pro-upgrade-link')).toHaveAttribute('href', '/welcome/spaces')
  })

  it('only shows the chip with Pro', () => {
    render(<ProChecksRow hasProFeatures />)

    expect(screen.getByLabelText('Safe Pro')).toBeInTheDocument()
    expect(screen.queryByTestId('pro-upgrade-link')).not.toBeInTheDocument()
  })
})
