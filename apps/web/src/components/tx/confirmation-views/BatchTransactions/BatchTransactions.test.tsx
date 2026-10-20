import { faker } from '@faker-js/faker'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
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

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

const renderBatch = (recipients: string[]) => {
  jest.spyOn(batching, 'useDraftBatch').mockReturnValue(recipients.map(draftItem))
  jest.spyOn(useTxPreview, 'default').mockReturnValue([preview(recipients), undefined, false])
  render(<BatchTransactions />)
  return screen.findAllByTestId('action-item')
}

describe('BatchTransactions', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows one numbered row per draft transaction with its amount and recipient', async () => {
    const recipients = [
      checksumAddress(faker.finance.ethereumAddress()),
      checksumAddress(faker.finance.ethereumAddress()),
    ]

    const rows = await renderBatch(recipients)

    expect(rows).toHaveLength(2)
    const items = screen.getAllByRole('listitem')
    recipients.forEach((recipient, index) => {
      expect(items[index]).toHaveTextContent(new RegExp(`^${index + 1}Send`))
      expect(rows[index]).toHaveTextContent(shortAddress(recipient))
    })
  })

  it('shows a single draft transaction without a MultiSend', async () => {
    const recipient = checksumAddress(faker.finance.ethereumAddress())

    const rows = await renderBatch([recipient])

    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent(shortAddress(recipient))
  })

  it('opens a row to show the decoded transaction and closes it again', async () => {
    const recipients = [
      checksumAddress(faker.finance.ethereumAddress()),
      checksumAddress(faker.finance.ethereumAddress()),
    ]
    const rows = await renderBatch(recipients)

    fireEvent.click(rows[0])

    await waitFor(() => expect(rows[0]).toHaveAttribute('aria-expanded', 'true'))
    expect(screen.getByText('Interacted with')).toBeInTheDocument()
    expect(screen.getByText(recipients[0])).toBeInTheDocument()

    fireEvent.click(rows[0])

    await waitFor(() => expect(rows[0]).toHaveAttribute('aria-expanded', 'false'))
  })

  it('shows a placeholder for each row until the batch is decoded', () => {
    jest.spyOn(batching, 'useDraftBatch').mockReturnValue([draftItem(checksumAddress(faker.finance.ethereumAddress()))])
    jest.spyOn(useTxPreview, 'default').mockReturnValue([undefined, undefined, true])

    render(<BatchTransactions />)

    expect(screen.queryByTestId('action-item')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})
