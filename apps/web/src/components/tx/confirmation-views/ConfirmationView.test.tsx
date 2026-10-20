import type { ComponentProps } from 'react'
import { faker } from '@faker-js/faker'
import type { MultiSend, TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { basicTypesActions, multiSendTxDataBuilder } from '@/tests/builders/dataDecoded'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import ConfirmationView from '.'

let mockDecodedDataThrows = false

jest.mock('@/services/observability', () => ({
  ...jest.requireActual('@/services/observability'),
  captureError: jest.fn(),
}))
jest.mock('@/components/transactions/TxDetails/TxData/DecodedData', () => {
  const { default: ActualDecodedData } = jest.requireActual('@/components/transactions/TxDetails/TxData/DecodedData')

  return {
    __esModule: true,
    default: (props: ComponentProps<typeof DecodedData>) => {
      if (mockDecodedDataThrows) throw new Error('Cannot render decoded value')
      return <ActualDecodedData {...props} />
    },
  }
})

const batchPreview = (actions: MultiSend[]): TransactionPreview => ({
  txInfo: {
    type: TransactionInfoType.CUSTOM,
    humanDescription: null,
    to: { value: faker.finance.ethereumAddress() },
    dataSize: '0',
    value: '0',
    methodName: 'multiSend',
    actionCount: actions.length,
    isCancellation: false,
  },
  txData: multiSendTxDataBuilder(actions).build(),
})

describe('ConfirmationView with decoded data', () => {
  beforeEach(() => {
    mockDecodedDataThrows = false
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

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
    mockDecodedDataThrows = true
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
