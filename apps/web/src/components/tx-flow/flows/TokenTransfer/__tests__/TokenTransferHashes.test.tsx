import { render } from '@/tests/test-utils'
import TokenTransferHashes from '../TokenTransferHashes'
import { SafeTxContext } from '../../../SafeTxProvider'
import { initialContext, TxFlowContext } from '../../../TxFlowProvider'
import { safeTxBuilder } from '@/tests/builders/safeTx'

// The details modal renders the heavy Receipt; stub it so we can assert open/close wiring only.
jest.mock('../TokenTransferDetailsModal', () => ({
  __esModule: true,
  default: () => <div data-testid="details-modal" />,
}))

const renderWithSubmitLoading = (isSubmitLoading: boolean) =>
  render(
    <TxFlowContext.Provider value={{ ...initialContext, isSubmitLoading }}>
      <SafeTxContext.Provider value={{ safeTx: safeTxBuilder().build() } as any}>
        <TokenTransferHashes />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

describe('TokenTransferHashes', () => {
  it('renders nothing without a safeTx', () => {
    const { container } = render(
      <SafeTxContext.Provider value={{ safeTx: undefined } as any}>
        <TokenTransferHashes />
      </SafeTxContext.Provider>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the Hashes panel and a Transaction details trigger once a safeTx exists', () => {
    const { getByText, getByTestId } = renderWithSubmitLoading(false)

    expect(getByText('Hashes')).toBeInTheDocument()
    expect(getByTestId('tx-details-btn')).toBeInTheDocument()
  })

  it('auto-opens the details while signing is in progress', () => {
    const { getByTestId } = renderWithSubmitLoading(true)

    expect(getByTestId('details-modal')).toBeInTheDocument()
  })

  it('keeps the details closed when not signing', () => {
    const { queryByTestId } = renderWithSubmitLoading(false)

    expect(queryByTestId('details-modal')).not.toBeInTheDocument()
  })
})
