import { useState } from 'react'
import { ShieldCheck, UsersRound } from 'lucide-react'
import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import PolicyIntroDialog, { type PolicyIntroDialogProps } from '../index'

const EXPLAINERS = [
  { Icon: UsersRound, text: 'The first thing to know.' },
  { Icon: ShieldCheck, text: 'The second thing to know.' },
]

const defaultProps: PolicyIntroDialogProps = {
  open: true,
  onOpenChange: jest.fn(),
  onProceed: jest.fn(),
  title: 'A policy',
  description: 'What the policy does.',
  helpArticle: 'https://help.safe.global/a-policy',
  helpLabel: 'Learn more about a policy',
  explainers: EXPLAINERS,
  preview: <div data-testid="a-preview" />,
  proceedLabel: 'Set up a policy',
  testId: 'a-policy-intro-dialog',
}

const StatefulIntro = (props: Partial<PolicyIntroDialogProps>) => {
  const [open, setOpen] = useState(true)

  return <PolicyIntroDialog {...defaultProps} {...props} open={open} onOpenChange={setOpen} />
}

describe('PolicyIntroDialog', () => {
  it('names the policy and what it does', () => {
    render(<PolicyIntroDialog {...defaultProps} />)

    expect(screen.getByRole('heading', { name: /A policy/ })).toBeInTheDocument()
    expect(screen.getByText('What the policy does.')).toBeInTheDocument()
  })

  it('renders the preview and every explainer', () => {
    render(<PolicyIntroDialog {...defaultProps} />)

    expect(screen.getByTestId('a-preview')).toBeInTheDocument()
    expect(screen.getByText('The first thing to know.')).toBeInTheDocument()
    expect(screen.getByText('The second thing to know.')).toBeInTheDocument()
  })

  it('links the title icon to the help article', () => {
    render(<PolicyIntroDialog {...defaultProps} />)

    expect(screen.getByRole('link', { name: 'Learn more about a policy' })).toHaveAttribute(
      'href',
      'https://help.safe.global/a-policy',
    )
  })

  it('opens focus on the primary action, not the title help link', async () => {
    render(<PolicyIntroDialog {...defaultProps} />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Set up a policy' })).toHaveFocus())
  })

  it('proceeds to the flow on the primary action', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(<PolicyIntroDialog {...defaultProps} onProceed={onProceed} />)

    await user.click(screen.getByRole('button', { name: 'Set up a policy' }))

    expect(onProceed).toHaveBeenCalledTimes(1)
  })

  it('closes without proceeding when dismissed', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(<StatefulIntro onProceed={onProceed} />)

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => expect(screen.queryByTestId('a-policy-intro-dialog')).not.toBeInTheDocument())
    expect(onProceed).not.toHaveBeenCalled()
  })

  it('renders nothing while closed', () => {
    render(<PolicyIntroDialog {...defaultProps} open={false} />)

    expect(screen.queryByTestId('a-policy-intro-dialog')).not.toBeInTheDocument()
  })
})
