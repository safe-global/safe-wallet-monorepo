import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { transactionDataBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import DecodedTxs from '../DecodedTxs'

const nativeTransfer = (to: string): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txData: transactionDataBuilder()
        .with({ to: { value: to }, value: '1000000000000000000' })
        .build(),
    })
    .build()

const customTx = ({ isCancellation, method }: { isCancellation: boolean; method?: string }): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        to: { value: checksumAddress(faker.finance.ethereumAddress()) },
        dataSize: method ? '68' : '0',
        value: '0',
        isCancellation,
        methodName: method ?? null,
      },
      txData: transactionDataBuilder()
        .with({
          hexData: method ? '0x095ea7b3' : '0x',
          dataDecoded: method ? { method, parameters: [] } : null,
        })
        .build(),
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
    const rows = await renderRows([
      customTx({ isCancellation: false, method: 'approve' }),
      customTx({ isCancellation: true }),
    ])

    expect(screen.getByText('Batched transactions')).toBeInTheDocument()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent(/^1approve$/)
    expect(rows[1]).toHaveTextContent(/^2On-chain rejection$/)
  })

  it('labels a rejection without decoded data as an on-chain rejection', async () => {
    const [row] = await renderRows([customTx({ isCancellation: true })])

    expect(row).toHaveTextContent('On-chain rejection')
  })

  it('shows a native transfer as its amount and recipient', async () => {
    const recipient = checksumAddress(faker.finance.ethereumAddress())

    const [row] = await renderRows([nativeTransfer(recipient)])

    expect(row).toHaveTextContent('Send1 ETH')
    expect(row).toHaveTextContent(`${recipient.slice(0, 6)}...${recipient.slice(-4)}`)
  })

  it('skips a transaction without data', async () => {
    const withoutData = transactionDetailsBuilder().with({ txData: null }).build()

    const rows = await renderRows([withoutData, customTx({ isCancellation: false, method: 'approve' })])

    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent(/^2approve$/)
  })

  it('opens and closes every row with "Expand all" and "Collapse all"', async () => {
    const rows = await renderRows([
      customTx({ isCancellation: false, method: 'approve' }),
      customTx({ isCancellation: true }),
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
    await waitFor(() => rows.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'true')))

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
    await waitFor(() => rows.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'false')))
  })
})
