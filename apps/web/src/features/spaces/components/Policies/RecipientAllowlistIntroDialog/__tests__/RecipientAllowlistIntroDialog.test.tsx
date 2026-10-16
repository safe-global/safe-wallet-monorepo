import { useState } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import RecipientAllowlistIntroDialog from '../index'

const StatefulIntro = ({ onProceed }: { onProceed: () => void }) => {
  const [open, setOpen] = useState(true)

  return <RecipientAllowlistIntroDialog open={open} onOpenChange={setOpen} onProceed={onProceed} />
}

describe('RecipientAllowlistIntroDialog', () => {
  it('names the policy and what it does', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('heading', { name: /Recipient allowlist/ })).toBeInTheDocument()
    expect(screen.getByText('Only let funds go to addresses you approve.')).toBeInTheDocument()
  })

  it('explains who can receive funds, that other transfers are blocked, and the 24-hour wait', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByText('Only addresses on the list can receive funds from this Safe account.')).toBeInTheDocument()
    expect(screen.getByText('Transfers to any other address are blocked.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Setting it up, changing it or removing it requires a transaction. Every change waits 24 hours before it applies.',
      ),
    ).toBeInTheDocument()
  })

  it('previews the allowed recipients', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByTestId('recipient-allowlist-preview')).toBeInTheDocument()
    expect(screen.getByText('Allowed recipients')).toBeInTheDocument()
  })

  it('renders an identicon, not a loading placeholder, for every previewed recipient', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    const preview = screen.getByTestId('recipient-allowlist-preview')
    expect(preview.querySelector('[data-slot="skeleton"]')).toBeNull()
  })

  it('links the title icon to the policies article', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Learn more about recipient allowlists' })).toHaveAttribute(
      'href',
      HelpCenterArticle.POLICIES,
    )
  })

  it('proceeds to the flow on the primary action', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(
      <RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={onProceed} />,
    )

    await user.click(screen.getByRole('button', { name: 'Set up recipient allowlist' }))

    expect(onProceed).toHaveBeenCalledTimes(1)
  })

  it('closes without proceeding when dismissed', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(<StatefulIntro onProceed={onProceed} />)

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => expect(screen.queryByTestId('recipient-allowlist-intro-dialog')).not.toBeInTheDocument())
    expect(onProceed).not.toHaveBeenCalled()
  })
})
