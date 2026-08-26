import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import SafeProAnnouncementModal from '../index'

describe('SafeProAnnouncementModal', () => {
  it('announces the move date and what Pro adds', () => {
    render(<SafeProAnnouncementModal open />)

    expect(screen.getByRole('heading', { name: 'Your Workspace moves to Pro on Oct 1, 2026' })).toBeInTheDocument()
    expect(
      screen.getByText(
        /Pro will add advanced security checks, sponsored transactions and policies\. Your Safe accounts remain available outside of the Workspace\. Starting October 1, you can claim up to two months of Safe Pro for free for this Workspace\./,
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

  it('closes when Got it is clicked', async () => {
    const onOpenChange = jest.fn()
    render(<SafeProAnnouncementModal open onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Got it' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders nothing until it is opened', () => {
    render(<SafeProAnnouncementModal />)

    expect(screen.queryByRole('link', { name: 'Learn more' })).not.toBeInTheDocument()
  })
})
