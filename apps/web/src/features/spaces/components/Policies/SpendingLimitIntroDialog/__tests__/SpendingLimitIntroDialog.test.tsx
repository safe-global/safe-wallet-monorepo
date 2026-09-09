import { useState } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import SpendingLimitIntroDialog from '../index'

/** Holds the open state the way the Policies page does, so dismissal is observable. */
const StatefulIntro = ({ onProceed }: { onProceed: () => void }) => {
  const [open, setOpen] = useState(true)

  return <SpendingLimitIntroDialog open={open} onOpenChange={setOpen} onProceed={onProceed} />
}

describe('SpendingLimitIntroDialog', () => {
  it('names the policy and what it does', () => {
    render(<SpendingLimitIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('heading', { name: /Spending limit/ })).toBeInTheDocument()
    expect(screen.getByText('Let spenders access assets without collecting signatures.')).toBeInTheDocument()
  })

  // The three things someone must understand before signing, per the design copy.
  it('explains that a spender need not be a signer', () => {
    render(<SpendingLimitIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(
      screen.getByText("Anyone can be a spender, they don't need to be signers of this Safe account."),
    ).toBeInTheDocument()
  })

  it('explains the token, the amount, the period and the automatic reset', () => {
    render(<SpendingLimitIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(
      screen.getByText(
        'Choose a token and an amount per day, week, or month. When the period ends, the limit resets automatically.',
      ),
    ).toBeInTheDocument()
  })

  it('explains that creating the limit costs a transaction but spending within it does not', () => {
    render(<SpendingLimitIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(
      screen.getByText(
        "Creating the limit requires a transaction. Once it's active, spending within the limit needs no further approvals.",
      ),
    ).toBeInTheDocument()
  })

  it('previews the end result: spenders, a token limit and the remaining balance', () => {
    render(<SpendingLimitIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    const preview = screen.getByTestId('spending-limit-preview')

    expect(preview).toBeInTheDocument()
    expect(screen.getAllByText('Spender')).toHaveLength(2)
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('1,500/Month')).toBeInTheDocument()
    expect(screen.getByText('500 USDC remaining')).toBeInTheDocument()
  })

  it('links the title icon to the spending limits article', () => {
    render(<SpendingLimitIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Learn more about spending limits' })).toHaveAttribute(
      'href',
      HelpCenterArticle.SPENDING_LIMITS,
    )
  })

  it('proceeds to the flow on the primary action', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(
      <SpendingLimitIntroDialog open onOpenChange={jest.fn()} onProceed={onProceed} />,
    )

    await user.click(screen.getByRole('button', { name: 'Set up spending limit' }))

    expect(onProceed).toHaveBeenCalledTimes(1)
  })

  it('closes without proceeding when dismissed', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(<StatefulIntro onProceed={onProceed} />)

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => expect(screen.queryByTestId('spending-limit-intro-dialog')).not.toBeInTheDocument())
    expect(onProceed).not.toHaveBeenCalled()
  })

  it('renders nothing while closed', () => {
    render(<SpendingLimitIntroDialog open={false} onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.queryByTestId('spending-limit-intro-dialog')).not.toBeInTheDocument()
  })
})
