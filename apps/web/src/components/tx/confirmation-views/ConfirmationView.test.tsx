import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { basicTypesActions, multiSendTxDataBuilder, multiSendTxInfo } from '@/tests/builders/dataDecoded'
import * as DecodedDataModule from '@/components/transactions/TxDetails/TxData/DecodedData'
import ConfirmationView from '.'

jest.mock('@/services/observability', () => ({
  ...jest.requireActual('@/services/observability'),
  captureRenderError: jest.fn(),
}))

const batchPreview = (actions: ReturnType<typeof basicTypesActions>): TransactionPreview => ({
  txInfo: multiSendTxInfo(actions.length),
  txData: multiSendTxDataBuilder(actions).build(),
})

describe('ConfirmationView with decoded data', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders every action of a batch that uses every ABI type', () => {
    const actions = basicTypesActions()
    render(<ConfirmationView txPreview={batchPreview(actions)} />)

    fireEvent.click(screen.getByTestId('expande-all-btn'))

    expect(screen.getAllByTestId('action-item')).toHaveLength(actions.length)
    expect(screen.queryByText('Error parsing data')).not.toBeInTheDocument()
  })

  it('keeps the rest of the review when the decoded data cannot be rendered', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(DecodedDataModule, 'default').mockImplementation(() => {
      throw new Error('Cannot render decoded value')
    })
    const actions = basicTypesActions().slice(0, 2)
    render(
      <ConfirmationView txPreview={batchPreview(actions)}>
        <div>Review footer</div>
      </ConfirmationView>,
    )

    fireEvent.click(screen.getByTestId('expande-all-btn'))

    expect(screen.getAllByText('Error parsing data')).toHaveLength(actions.length)
    expect(screen.getAllByTestId('action-item')).toHaveLength(actions.length)
    expect(screen.getByText('Review footer')).toBeInTheDocument()
  })
})
