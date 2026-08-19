import { render } from '@/tests/test-utils'
import TxCheckError from '..'

describe('TxCheckError', () => {
  it('warns the transaction will fail for a genuine on-chain revert', () => {
    const revert = Object.assign(new Error('execution reverted'), { reason: 'GS013' })
    const { getByText, queryByText } = render(<TxCheckError error={revert} />)

    expect(getByText(/most likely fail/)).toBeInTheDocument()
    expect(queryByText(/Could not check/)).not.toBeInTheDocument()
  })

  it('says it could not check for an infrastructure failure', () => {
    const infra = new Error('HTTP request failed. Status: 500')
    const { getByText, queryByText } = render(<TxCheckError error={infra} />)

    expect(getByText(/Could not check this transaction/)).toBeInTheDocument()
    expect(getByText(/Nothing was signed/)).toBeInTheDocument()
    // Must NOT claim the transaction will fail when we simply could not reach the node.
    expect(queryByText(/most likely fail/)).not.toBeInTheDocument()
  })
})
