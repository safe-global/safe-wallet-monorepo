import { faker } from '@faker-js/faker'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { OperationType } from '@safe-global/types-kit'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { DraftBatchItem } from '@/features/batching/store'
import * as batching from '@/features/batching'
import * as useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import BatchTransactions from '.'

const MULTI_SEND_SELECTOR = '0x8d80ff0a'
const ONE_GWEI = '1000000000'

const draftItem = (to: string): DraftBatchItem => ({
  id: faker.string.alphanumeric(10),
  timestamp: faker.date.recent().getTime(),
  txData: { to, value: ONE_GWEI, data: '0x', operation: OperationType.Call },
})

const preview = (recipients: string[]): TransactionPreview => {
  const actions = recipients.map((to) => ({ to, value: ONE_GWEI, data: '0x', operation: Operation.CALL }))
  return {
    txData: {
      hexData: recipients.length > 1 ? `${MULTI_SEND_SELECTOR}00` : '0x',
      dataDecoded:
        recipients.length > 1
          ? {
              method: 'multiSend',
              parameters: [{ name: 'transactions', type: 'bytes', value: '0x', valueDecoded: actions }],
            }
          : undefined,
      to: { value: recipients[0] },
      value: recipients.length > 1 ? '0' : ONE_GWEI,
      operation: Operation.CALL,
      trustedDelegateCallTarget: false,
      addressInfoIndex: {},
    },
    txInfo: {
      type: TransactionInfoType.CUSTOM,
      to: { value: recipients[0] },
      dataSize: '0',
      value: '0',
      isCancellation: false,
      methodName: null,
    },
  }
}

const randomAddresses = (count: number) =>
  Array.from({ length: count }, () => checksumAddress(faker.finance.ethereumAddress()))

const renderBatch = (recipients: string[], { isDecoded = true } = {}) => {
  jest.spyOn(batching, 'useDraftBatch').mockReturnValue(recipients.map(draftItem))
  const decoded = isDecoded ? preview(recipients) : undefined
  jest.spyOn(useTxPreview, 'default').mockReturnValue([decoded, undefined, !isDecoded])
  render(<BatchTransactions />)
}

const rowsOf = () => screen.getAllByRole('listitem')

describe('BatchTransactions', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('numbers each draft row and shows its decoded amount and recipient', async () => {
    const recipients = randomAddresses(2)

    renderBatch(recipients)

    await screen.findAllByTestId('action-item')
    rowsOf().forEach((row, index) => {
      expect(row).toHaveTextContent(new RegExp(`^${index + 1}Send`))
      expect(row).toHaveTextContent(shortenAddress(recipients[index]))
    })
  })

  it('shows a single draft transaction that is not a MultiSend', async () => {
    const [recipient] = randomAddresses(1)

    renderBatch([recipient])

    await screen.findByTestId('action-item')
    expect(rowsOf()).toHaveLength(1)
    expect(rowsOf()[0]).toHaveTextContent(shortenAddress(recipient))
  })

  it('opens a row to show the decoded transaction and closes it again', async () => {
    const recipients = randomAddresses(2)
    renderBatch(recipients)
    const [firstRow] = await screen.findAllByTestId('action-item')

    fireEvent.click(firstRow)

    await waitFor(() => expect(firstRow).toHaveAttribute('aria-expanded', 'true'))
    expect(screen.getByText('Interacted with')).toBeInTheDocument()
    expect(screen.getByText(recipients[0])).toBeInTheDocument()

    fireEvent.click(firstRow)

    await waitFor(() => expect(firstRow).toHaveAttribute('aria-expanded', 'false'))
  })

  it('shows a placeholder for each row until the batch is decoded', () => {
    renderBatch(randomAddresses(2), { isDecoded: false })

    expect(screen.queryByTestId('action-item')).not.toBeInTheDocument()
    expect(rowsOf()).toHaveLength(2)
  })
})
