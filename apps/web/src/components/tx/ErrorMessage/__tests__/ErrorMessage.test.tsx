import { render, fireEvent } from '@/tests/test-utils'
import ErrorMessage from '..'

describe('ErrorMessage', () => {
  it('renders the children message', () => {
    const { getByText } = render(<ErrorMessage>Transaction failed</ErrorMessage>)
    expect(getByText('Transaction failed')).toBeInTheDocument()
  })

  it('shows a support reference behind Details — never the raw payload', () => {
    const raw =
      'HTTP request failed. URL: https://berachain.drpc.org Request body: {"method":"eth_call"} Version: viem@2.52.2 reason "GS013"'

    const { getByText, queryByText, getByTestId } = render(
      <ErrorMessage error={new Error(raw)}>This transaction will most likely fail.</ErrorMessage>,
    )

    // Raw payload is never rendered, collapsed or not
    expect(queryByText(/drpc\.org/)).not.toBeInTheDocument()

    fireEvent.click(getByText('Details'))

    expect(getByTestId('error-details')).toBeInTheDocument()
    expect(getByText('GS013')).toBeInTheDocument()
    expect(queryByText(/drpc\.org/)).not.toBeInTheDocument()
    expect(queryByText(/viem@/)).not.toBeInTheDocument()
    expect(queryByText(/eth_call/)).not.toBeInTheDocument()
  })
})
