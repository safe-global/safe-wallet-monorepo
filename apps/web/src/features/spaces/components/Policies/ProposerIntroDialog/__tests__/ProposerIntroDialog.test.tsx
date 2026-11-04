import { useState } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import ProposerIntroDialog from '../index'

const StatefulIntro = ({ onProceed }: { onProceed: () => void }) => {
  const [open, setOpen] = useState(true)

  return <ProposerIntroDialog open={open} onOpenChange={setOpen} onProceed={onProceed} />
}

describe('ProposerIntroDialog', () => {
  it('names the policy and what it does', () => {
    render(<ProposerIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('heading', { name: /Proposer role/ })).toBeInTheDocument()
    expect(screen.getByText('Let teammates without signing rights propose transactions.')).toBeInTheDocument()
  })

  it('explains that a proposer can suggest but not approve or execute', () => {
    render(<ProposerIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(
      screen.getByText('Proposers can suggest transactions but cannot approve or execute them.'),
    ).toBeInTheDocument()
  })

  it('explains that preparation is separated from approval without losing security', () => {
    render(<ProposerIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(
      screen.getByText('Separate transaction preparation from transaction approval while maintaining security.'),
    ).toBeInTheDocument()
  })

  it('explains that changes still require owner signatures', () => {
    render(<ProposerIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(
      screen.getByText('Any changes require owner signatures, and all permissions are managed through Safe{Wallet}.'),
    ).toBeInTheDocument()
  })

  it('previews the end result: transactions, signers and proposers', () => {
    render(<ProposerIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByTestId('proposer-preview')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Signers')).toBeInTheDocument()
    expect(screen.getByText('Proposers')).toBeInTheDocument()
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('links the title icon to the proposers article', () => {
    render(<ProposerIntroDialog open onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Learn more about proposers' })).toHaveAttribute(
      'href',
      HelpCenterArticle.PROPOSERS,
    )
  })

  it('proceeds to the flow on the primary action', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(<ProposerIntroDialog open onOpenChange={jest.fn()} onProceed={onProceed} />)

    await user.click(screen.getByRole('button', { name: 'Set up proposer' }))

    expect(onProceed).toHaveBeenCalledTimes(1)
  })

  it('closes without proceeding when dismissed', async () => {
    const onProceed = jest.fn()
    const { user } = renderWithUserEvent(<StatefulIntro onProceed={onProceed} />)

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument())
    expect(onProceed).not.toHaveBeenCalled()
  })

  it('renders nothing while closed', () => {
    render(<ProposerIntroDialog open={false} onOpenChange={jest.fn()} onProceed={jest.fn()} />)

    expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
  })
})
