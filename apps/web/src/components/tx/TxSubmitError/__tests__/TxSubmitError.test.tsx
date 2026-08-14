import { render } from '@/tests/test-utils'
import type { EthersError } from '@/utils/ethers-utils'
import type { TransactionReceipt } from 'ethers'
import { Gs026PreCheckError } from '@/services/tx/executionPreChecks'
import TxSubmitError from '..'

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
})
