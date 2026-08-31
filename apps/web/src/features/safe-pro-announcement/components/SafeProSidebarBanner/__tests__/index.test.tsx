import { render, screen } from '@/tests/test-utils'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import SafeProSidebarBanner from '../index'

describe('SafeProSidebarBanner', () => {
  it('renders the headline and the supporting line', () => {
    render(<SafeProSidebarBanner />)

    expect(screen.getByText('Your Workspace moves to Safe Pro on Oct 6, 2026')).toBeInTheDocument()
    expect(screen.getByText('Your Safe accounts remain available outside the Workspace.')).toBeInTheDocument()
  })

  it('points the Learn more CTA at the announcement in a safe new tab', () => {
    render(<SafeProSidebarBanner />)

    const cta = screen.getByRole('link', { name: 'Learn more' })
    expect(cta).toHaveAttribute('href', SAFE_PRO_ANNOUNCEMENT_URL)
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
