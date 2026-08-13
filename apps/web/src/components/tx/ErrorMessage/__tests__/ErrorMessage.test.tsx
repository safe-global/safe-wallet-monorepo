import { render, fireEvent } from '@/tests/test-utils'
import ErrorMessage from '..'

describe('ErrorMessage', () => {
  it('renders the children message', () => {
    const { getByText } = render(<ErrorMessage>Transaction failed</ErrorMessage>)
    expect(getByText('Transaction failed')).toBeInTheDocument()
  })

  it('shows an always-visible, code-only reference for a GS error — never the raw payload', () => {
    const raw =
      'HTTP request failed. URL: https://berachain.drpc.org Request body: {"method":"eth_call"} Version: viem@2.52.2 reason "GS013"'

    const { getByText, queryByText } = render(
      <ErrorMessage error={new Error(raw)}>This transaction will most likely fail.</ErrorMessage>,
    )

    // The code is shown inline without a Details toggle
    expect(queryByText('Details')).not.toBeInTheDocument()
    expect(getByText('GS013')).toBeInTheDocument()
    expect(queryByText(/drpc\.org/)).not.toBeInTheDocument()
    expect(queryByText(/viem@/)).not.toBeInTheDocument()
    expect(queryByText(/eth_call/)).not.toBeInTheDocument()
  })

  it('shows the raw message for a non-GS error (on-chain-scoped ticket)', () => {
    const raw = 'Request failed at https://rpc.example.org using viem@2.0.0'

    const { getByText, queryByText } = render(<ErrorMessage error={new Error(raw)}>Something failed.</ErrorMessage>)

    fireEvent.click(getByText('Details'))

    // No GS code → the original raw-message Details is kept (unchanged by this ticket).
    expect(queryByText(/rpc\.example\.org/)).toBeInTheDocument()
  })
})
