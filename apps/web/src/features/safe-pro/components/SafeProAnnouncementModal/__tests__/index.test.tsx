import { render, screen } from '@/tests/test-utils'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import SafeProAnnouncementModal from '../index'

describe('SafeProAnnouncementModal', () => {
  it('announces the move date and what Pro adds', () => {
    render(<SafeProAnnouncementModal open />)

    expect(screen.getByRole('heading', { name: 'Your Workspace moves to Pro on Oct 1, 2026' })).toBeInTheDocument()
    expect(
      screen.getByText(
        /Pro adds policies, advanced security checks and sponsored transactions\. Your Safe accounts stay available outside the Workspace\./,
      ),
    ).toBeInTheDocument()
  })

  it('points the Learn more CTA at the announcement in a safe new tab', () => {
    render(<SafeProAnnouncementModal open />)

    const cta = screen.getByRole('link', { name: 'Learn more' })
    expect(cta).toHaveAttribute('href', SAFE_PRO_ANNOUNCEMENT_URL)
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('renders nothing until it is opened', () => {
    render(<SafeProAnnouncementModal />)

    expect(screen.queryByRole('link', { name: 'Learn more' })).not.toBeInTheDocument()
  })
})
