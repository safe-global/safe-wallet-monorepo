import { render } from '@/tests/test-utils'
import type { EthersError } from '@/utils/ethers-utils'
import type { TransactionReceipt } from 'ethers'
import TxSubmitError from '..'

describe('TxSubmitError', () => {
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
