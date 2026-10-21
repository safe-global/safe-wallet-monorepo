import { render, screen } from '@/tests/test-utils'
import AllowlistSummary from '../AllowlistSummary'

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

  it('joins two tokens with "and"', () => {
    render(<AllowlistSummary accountLabel="Payments on Sepolia" tokenSymbols={['A', 'B']} recipientNames={['Alice']} />)

    expect(screen.getByText('Payments on Sepolia will only be able to send A and B to Alice.')).toBeInTheDocument()
  })
})
