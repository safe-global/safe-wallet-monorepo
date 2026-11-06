import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { render, screen } from '@/tests/test-utils'
import AllowlistSummary from '../AllowlistSummary'

jest.mock('@safe-global/views/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, render }: { children: ReactNode; render: ReactElement }) =>
    cloneElement(render, {}, children),
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

describe('AllowlistSummary', () => {
  it('asks for a Safe account when none is picked', () => {
    render(<AllowlistSummary tokenSymbols={[]} recipientNames={[]} />)

    expect(screen.getByText('Pick a Safe account to start.')).toBeInTheDocument()
    expect(screen.getByText('Then choose which tokens it can send and who can receive them.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'When this takes effect' })).not.toBeInTheDocument()
  })

  it('asks for a token and a recipient while the selection is incomplete', () => {
    render(<AllowlistSummary accountLabel="Payments on Sepolia" tokenSymbols={['ETH']} recipientNames={[]} />)

    expect(
      screen.getByText(
        'To create an allowlist policy on Payments on Sepolia, select at least one token and one recipient.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Anything you leave out will be blocked.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'When this takes effect' })).toBeInTheDocument()
  })

  it('lists up to three tokens by symbol and a single recipient by name', () => {
    render(
      <AllowlistSummary accountLabel="Payments on Sepolia" tokenSymbols={['A', 'B', 'C']} recipientNames={['Alice']} />,
    )

    expect(screen.getByText('Payments on Sepolia will only be able to send A, B and C to Alice.')).toBeInTheDocument()
  })

  it('uses a single symbol as is and counts four tokens and several recipients', () => {
    const { rerender } = render(
      <AllowlistSummary accountLabel="Payments on Sepolia" tokenSymbols={['A']} recipientNames={['Alice']} />,
    )
    expect(screen.getByText('Payments on Sepolia will only be able to send A to Alice.')).toBeInTheDocument()

    rerender(
      <AllowlistSummary
        accountLabel="Payments on Sepolia"
        tokenSymbols={['A', 'B', 'C', 'D']}
        recipientNames={['Alice', 'Bob']}
      />,
    )
    expect(
      screen.getByText('Payments on Sepolia will only be able to send 4 tokens to 2 recipients.'),
    ).toBeInTheDocument()
  })

  it('counts tokens that share a symbol instead of repeating it', () => {
    render(
      <AllowlistSummary
        accountLabel="Payments on Sepolia"
        tokenSymbols={['USDC', 'USDC']}
        recipientNames={['Alice']}
      />,
    )

    expect(screen.getByText('Payments on Sepolia will only be able to send 2 tokens to Alice.')).toBeInTheDocument()
  })

  it('joins two tokens with "and"', () => {
    render(<AllowlistSummary accountLabel="Payments on Sepolia" tokenSymbols={['A', 'B']} recipientNames={['Alice']} />)

    expect(screen.getByText('Payments on Sepolia will only be able to send A and B to Alice.')).toBeInTheDocument()
  })

  it('says the changes apply on execution when the policy guard is not enabled yet', () => {
    render(<AllowlistSummary accountLabel="Payments" tokenSymbols={['A']} recipientNames={['Alice']} />)

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'These changes take effect as soon as this transaction is executed.',
    )
  })

  it('says the changes wait 24 hours and need activation when the policy guard is already enabled', () => {
    render(<AllowlistSummary accountLabel="Payments" tokenSymbols={['A']} recipientNames={['Alice']} isGuardEnabled />)

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'The Safe policy guard is already enabled, so these changes wait 24 hours after execution, then need an activation step before they apply.',
    )
  })

  it('shows the given description instead of the default one', () => {
    render(
      <AllowlistSummary
        accountLabel="Payments"
        tokenSymbols={['A']}
        recipientNames={['Alice']}
        description="Check the details below before you sign."
      />,
    )

    expect(screen.getByText('Check the details below before you sign.')).toBeInTheDocument()
    expect(screen.queryByText('Anything you leave out will be blocked.')).not.toBeInTheDocument()
  })
})
