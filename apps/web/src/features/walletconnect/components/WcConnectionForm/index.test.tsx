import { render, screen, within } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import local from '@/services/local-storage/local'
import WcConnectionForm from '.'

describe('WcConnectionForm', () => {
  it('shows the hints by default and hides them via the info button', async () => {
    local.setItem('wcHints', true)
    render(<WcConnectionForm sessions={[]} uri="" />)

    expect(screen.getByText('How do I connect to a dApp?')).toBeInTheDocument()

    const trigger = document.querySelector('span.infoIcon')
    expect(trigger).not.toBeNull()
    await userEvent.click(within(trigger as HTMLElement).getByRole('button'))

    expect(screen.queryByText('How do I connect to a dApp?')).not.toBeInTheDocument()
  })

  // The tooltip anchors to its trigger element, so the trigger itself must carry the absolute
  // positioning that places the icon in the popup corner — otherwise the tooltip opens where the
  // collapsed trigger sits in normal flow, in the middle of the popup.
  it('positions the tooltip trigger with the info icon', () => {
    render(<WcConnectionForm sessions={[]} uri="" />)

    const trigger = document.querySelector('span.infoIcon')
    expect(trigger).not.toBeNull()
    expect(within(trigger as HTMLElement).getByRole('button')).toBeInTheDocument()
  })
})
