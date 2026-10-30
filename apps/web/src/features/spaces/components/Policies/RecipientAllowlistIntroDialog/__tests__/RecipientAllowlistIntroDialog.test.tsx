import { useState } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import RecipientAllowlistIntroDialog from '../index'

const StatefulIntro = ({ onProceed }: { onProceed: () => void }) => {
  const [open, setOpen] = useState(true)

  return <RecipientAllowlistIntroDialog open={open} onOpenChange={setOpen} onProceed={onProceed} />
}

describe('RecipientAllowlistIntroDialog', () => {
  it('should name the allowlist, when it opens', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('heading', { name: 'Allowlist' })).toBeInTheDocument()
  })

  it('should explain who can receive funds, the onchain check and the 3-minute wait, when it opens', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByText('You choose who can receive funds and which tokens.')).toBeInTheDocument()
    expect(
      screen.getByText("It's checked onchain, so a blocked action fails even if every signer approves it."),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Every change needs a transaction and waits 3 minutes before it applies.'),
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

  it('should say every other action is blocked and link the policies article, when it opens', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByText('Every other action')).toBeInTheDocument()
    expect(screen.getByText('Blocked')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', HelpCenterArticle.POLICIES)
  })

  it('should not let the owner set up, when they have not confirmed that other actions are blocked', () => {
    render(<RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Set up allowlist' })).toBeDisabled()
  })

  it('should proceed to the flow, when the owner confirms and sets up', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(
      <RecipientAllowlistIntroDialog open onOpenChange={jest.fn()} onProceed={onProceed} />,
    )

    await user.click(screen.getByRole('checkbox', { name: /I understand that anything not allowed will be blocked/ }))
    await user.click(screen.getByRole('button', { name: 'Set up allowlist' }))

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
