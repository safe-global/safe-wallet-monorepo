import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { transactionDataBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import DecodedTxs from '../DecodedTxs'

const ONE_ETH = '1000000000000000000'
const APPROVE_SELECTOR = '0x095ea7b3'
const APPROVE_CALLDATA_BYTES = '68'

const randomAddress = () => checksumAddress(faker.finance.ethereumAddress())

const nativeTransfer = (to: string): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txData: transactionDataBuilder()
        .with({ to: { value: to }, value: ONE_ETH })
        .build(),
    })
    .build()

const approveTx = (): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        to: { value: randomAddress() },
        dataSize: APPROVE_CALLDATA_BYTES,
        value: '0',
        isCancellation: false,
        methodName: 'approve',
      },
      txData: transactionDataBuilder()
        .with({ hexData: APPROVE_SELECTOR, dataDecoded: { method: 'approve', parameters: [] } })
        .build(),
    })
    .build()

const rejectionTx = (): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        to: { value: randomAddress() },
        dataSize: '0',
        value: '0',
        isCancellation: true,
        methodName: null,
      },
      txData: transactionDataBuilder().with({ hexData: '0x', dataDecoded: null }).build(),
    })
    .build()

const renderRows = async (txs: TransactionDetails[]) => {
  render(<DecodedTxs txs={txs} />)
  return screen.findAllByTestId('action-item')
}

describe('DecodedTxs', () => {
  it('renders nothing without transactions', () => {
    const { container } = render(<DecodedTxs txs={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the "Batched transactions" header and one numbered row per transaction', async () => {
    const rows = await renderRows([approveTx(), approveTx()])

    expect(screen.getByText('Batched transactions')).toBeInTheDocument()
    expect(rows.map((row) => row.textContent)).toEqual(['1approve', '2approve'])
  })

  it('labels a rejection without decoded data as an on-chain rejection', async () => {
    const [row] = await renderRows([rejectionTx()])

    expect(row).toHaveTextContent('On-chain rejection')
  })

  it('shows a native transfer as its amount and recipient', async () => {
    const recipient = randomAddress()

    const [row] = await renderRows([nativeTransfer(recipient)])

    expect(row).toHaveTextContent('Send1 ETH')
    expect(row).toHaveTextContent(shortenAddress(recipient))
  })

  it('numbers the rows without a gap for a transaction without data', async () => {
    const withoutData = transactionDetailsBuilder().with({ txData: null }).build()

    const rows = await renderRows([withoutData, approveTx()])

    expect(rows.map((row) => row.textContent)).toEqual(['1approve'])
  })

  it('opens and closes every row with "Expand all" and "Collapse all"', async () => {
    const rows = await renderRows([approveTx(), rejectionTx()])

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
    await waitFor(() => rows.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'true')))

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
    await waitFor(() => rows.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'false')))
  })
})
