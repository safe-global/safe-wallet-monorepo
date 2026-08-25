import { render, screen } from '@/tests/test-utils'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import SafeProBanner from '../index'

describe('SafeProBanner', () => {
  it('renders the headline and the New tag', () => {
    render(<SafeProBanner />)

    expect(screen.getByText('Workspaces move to Pro on Oct 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('makes the whole banner one link to the announcement in a safe new tab', () => {
    render(<SafeProBanner />)

    const cta = screen.getByRole('link', { name: /Workspaces move to Pro on Oct 1, 2026/ })
    expect(cta).toHaveAttribute('href', SAFE_PRO_ANNOUNCEMENT_URL)
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
