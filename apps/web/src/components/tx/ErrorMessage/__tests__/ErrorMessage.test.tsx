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

  it('treats a custom-error revert as GS013 and decodes a known selector', () => {
    const error = Object.assign(new Error('execution reverted (unknown custom error)'), {
      code: 'CALL_EXCEPTION',
      data: '0x70cc6907',
    })

    const { getByText, queryByText } = render(<ErrorMessage error={error}>This transaction failed.</ErrorMessage>)

    expect(getByText(/GS013 · UnapprovedHash \(Hypernative guard\)/)).toBeInTheDocument()
    // The reference replaces the raw Details toggle
    expect(queryByText('Details')).not.toBeInTheDocument()
  })

  it('keeps the raw selector in the reference for an undecodable custom error', () => {
    const error = Object.assign(new Error('execution reverted (unknown custom error)'), {
      code: 'CALL_EXCEPTION',
      data: '0xdeadbeef',
    })

    const { getByText, queryByText } = render(<ErrorMessage error={error}>This transaction failed.</ErrorMessage>)

    expect(getByText(/GS013 · 0xdeadbeef/)).toBeInTheDocument()
    // The selector belongs in the support reference, never in the message body
    expect(queryByText(/0xdeadbeef.*failed|failed.*0xdeadbeef/)).not.toBeInTheDocument()
  })
  it('offers no Details for a revert that carries no decodable payload', () => {
    // MultiSendCallOnly swallows the inner reason, so ethers hands us the whole
    // request as the message. There is nothing to reference and nothing safe to
    // show (WA-3267).
    const error = Object.assign(
      new Error(
        'execution reverted (no data present; likely require(false) occurred (action="estimateGas", data="0x", reason="require(false)", transaction={ "data": "0x0075fe14a68278bda1623e877aa155a9c97d106e7", "to": "0x9641d764fc13c8B624cO4430C7356C1C7C8102e2" }, code=CALL_EXCEPTION, version=6.17.0)',
      ),
      { code: 'CALL_EXCEPTION', data: '0x', reason: 'require(false)' },
    )

    const { getByText, queryByText } = render(
      <ErrorMessage error={error}>Could not submit the transaction.</ErrorMessage>,
    )

    expect(getByText('Could not submit the transaction.')).toBeInTheDocument()
    expect(queryByText('Details')).not.toBeInTheDocument()
    expect(queryByText(/require\(false\)/)).not.toBeInTheDocument()
    expect(queryByText(/version=6\.17\.0/)).not.toBeInTheDocument()
    expect(queryByText(/0x9641d764/)).not.toBeInTheDocument()
  })
  it('keeps a decoded revert reason but not the payload around it', () => {
    const error = Object.assign(
      new Error(
        'execution reverted: ERC20: transfer amount exceeds balance (action="estimateGas", data="0x08c379a0deadbeef", code=CALL_EXCEPTION, version=6.17.0)',
      ),
      {
        code: 'CALL_EXCEPTION',
        data: `0x08c379a0${'00'.repeat(64)}`,
        reason: 'ERC20: transfer amount exceeds balance',
      },
    )

    const { getByText, queryByText } = render(<ErrorMessage error={error}>Could not submit.</ErrorMessage>)

    fireEvent.click(getByText('Details'))

    expect(getByText('ERC20: transfer amount exceeds balance')).toBeInTheDocument()
    expect(queryByText(/version=6\.17\.0/)).not.toBeInTheDocument()
    expect(queryByText(/0x08c379a0deadbeef/)).not.toBeInTheDocument()
  })
})
