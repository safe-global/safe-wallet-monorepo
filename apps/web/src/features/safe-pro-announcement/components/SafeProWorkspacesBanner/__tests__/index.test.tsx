import { render, screen } from '@/tests/test-utils'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import SafeProWorkspacesBanner from '../index'

let mockIsLive = false
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockIsLive }))

describe('SafeProWorkspacesBanner', () => {
  beforeEach(() => {
    mockIsLive = false
  })

  it('speaks in the past once Safe Pro is live', () => {
    mockIsLive = true
    render(<SafeProWorkspacesBanner />)

    expect(screen.getByText('Workspaces moved to Safe Pro on Oct 6, 2026')).toBeInTheDocument()
  })

  it('renders the headline and the supporting line', () => {
    render(<SafeProWorkspacesBanner />)

    expect(screen.getByText('Workspaces move to Safe Pro on Oct 6, 2026')).toBeInTheDocument()
    expect(screen.getByText('Your Safe accounts remain free in My accounts.')).toBeInTheDocument()
  })

  it('points the Learn more CTA at the announcement in a safe new tab', () => {
    render(<SafeProWorkspacesBanner />)

    const cta = screen.getByRole('link', { name: 'Learn more' })
    expect(cta).toHaveAttribute('href', SAFE_PRO_ANNOUNCEMENT_URL)
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
