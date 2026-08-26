import { render } from '@/tests/test-utils'
import type { EthersError } from '@/utils/ethers-utils'
import type { TransactionReceipt } from 'ethers'
import { Gs026PreCheckError } from '@/services/tx/executionPreChecks'
import { BaseError } from 'viem'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { RATE_LIMIT_USER_MESSAGE } from '@/utils/transaction-errors'
import TxSubmitError from '..'

const HTML_502 =
  '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>'

describe('TxSubmitError', () => {
  it('shows the cause-specific message for a failed GS026 pre-check', () => {
    const { getByText, queryByText } = render(<TxSubmitError error={new Gs026PreCheckError('STALE_NONCE')} />)

    expect(getByText('Another transaction used this nonce. Refresh to get the current one.')).toBeInTheDocument()
    expect(queryByText(/Could not submit/)).not.toBeInTheDocument()
  })

  it('shows the always-visible GS026 code reference for a failed pre-check', () => {
    const { getByText, getByTestId, queryByText } = render(
      <TxSubmitError error={new Gs026PreCheckError('STALE_NONCE')} />,
    )

    // GS errors show the code-only reference inline — no Details toggle
    expect(getByTestId('error-details')).toBeInTheDocument()
    expect(getByText('GS026')).toBeInTheDocument()
    expect(queryByText('Details')).not.toBeInTheDocument()
  })

  it('shows the stale-nonce message for a wallet (EOA) nonce-too-low rejection', () => {
    // viem wraps the RPC rejection as a contract revert — must not be
    // classified as one (no gas was spent, nothing was mined)
    const error = new Error(
      'The contract function "execTransaction" reverted with the following reason:\nRPC 0xaa36a7 Infura eth_sendRawTransaction: nonce too low: next nonce 42, tx nonce 41',
    )

    const { getByText, queryByText } = render(<TxSubmitError error={error} />)

    expect(getByText('Another transaction used this nonce. Refresh to get the current one.')).toBeInTheDocument()
    expect(queryByText(/Gas was spent/)).not.toBeInTheDocument()
    expect(queryByText(/Could not submit/)).not.toBeInTheDocument()
  })

  it('claims gas was spent only for a mined revert (receipt status 0)', () => {
    const error = Object.assign(new Error('execution reverted'), {
      reason: 'GS013',
      receipt: { status: 0 } as TransactionReceipt,
    }) as EthersError

    const { getByText } = render(<TxSubmitError error={error} />)

    expect(getByText(/reverted on .*\. Gas was spent\./)).toBeInTheDocument()
  })

  it('does NOT claim gas was spent for a pre-broadcast revert, and offers no retry', () => {
    // No receipt = nothing hit the chain = no gas spent.
    const error = Object.assign(new Error('execution reverted'), { reason: 'GS013' })

    const { getByText, queryByText } = render(<TxSubmitError error={error} />)

    expect(getByText('Could not submit the transaction.')).toBeInTheDocument()
    expect(queryByText(/Gas was spent/)).not.toBeInTheDocument()
    expect(queryByText(/try again/i)).not.toBeInTheDocument()
  })

  it('offers a retry for a transient (non-revert) submission failure', () => {
    const error = new Error('HTTP request failed. Status: 500')

    const { getByText } = render(<TxSubmitError error={error} />)

    expect(getByText('Could not submit the transaction. Try again.')).toBeInTheDocument()
  })

  describe('CGW response states (WA-3252)', () => {
    it.each([429, 502, 500, 503, 422])('renders the agreed copy for a %s from CGW', (status) => {
      const error = asError({ status, data: {} })

      const { getByText } = render(<TxSubmitError error={error} />)

      expect(getByText('Something went wrong on our end. Try again.')).toBeInTheDocument()
    })

    it('renders the agreed copy — not the raw HTML — for the original 502 defect', () => {
      const error = asError({
        status: 'PARSING_ERROR',
        originalStatus: 502,
        data: HTML_502,
        error: "SyntaxError: Unexpected token '<'",
      })

      const { getByText, queryByText, container } = render(<TxSubmitError error={error} />)

      expect(getByText('Something went wrong on our end. Try again.')).toBeInTheDocument()
      expect(container.textContent).not.toContain('Bad Gateway')
      expect(container.textContent).not.toContain('nginx')
      expect(container.textContent).not.toContain('<')
      expect(queryByText(/Could not submit/)).not.toBeInTheDocument()
    })

    it('renders the banned-Safe copy for a 451', () => {
      const error = asError({ status: 451, data: {} })

      const { getByText } = render(<TxSubmitError error={error} />)

      expect(getByText('This Safe Account is not available.')).toBeInTheDocument()
    })

    it('shows a code-only support reference instead of a raw Details payload', () => {
      const error = asError({
        status: 'PARSING_ERROR',
        originalStatus: 502,
        data: HTML_502,
        error: "SyntaxError: Unexpected token '<'",
      })

      const { getByTestId, getByText, queryByText } = render(<TxSubmitError error={error} />)

      expect(getByTestId('error-details')).toBeInTheDocument()
      expect(getByText('CGW-502')).toBeInTheDocument()
      expect(queryByText('Details')).not.toBeInTheDocument()
    })

    it('leaves a 404 alone — out of scope for this mapping', () => {
      const error = asError({ status: 404, data: {} })

      const { getByText, queryByText } = render(<TxSubmitError error={error} />)

      expect(getByText('Could not submit the transaction. Try again.')).toBeInTheDocument()
      expect(queryByText(/on our end/)).not.toBeInTheDocument()
    })

    it('prefers the rate-limit copy over the CGW copy for a 429-carrying error, as the toast does', () => {
      // Counterpart of the same-named test in `useTxNotifications`: a throttled
      // request matches both classifiers, and both surfaces must resolve it the
      // same way (WA-3252).
      const error = Object.assign(new BaseError('HTTP request failed.'), { status: 429 })

      const { getByText, queryByText } = render(<TxSubmitError error={error} />)

      expect(getByText(RATE_LIMIT_USER_MESSAGE)).toBeInTheDocument()
      expect(queryByText(/on our end/)).not.toBeInTheDocument()
    })
  })
})
