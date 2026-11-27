import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import type { TransactionDetails, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { mockChainId, mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import { TxModalContext } from '@/components/tx-flow'
import { ExecuteBatchFlow } from '@/components/tx-flow/flows'
import BatchExecuteButton from '.'

jest.mock('@/hooks/useTxQueue')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/services/analytics')

let mockTxDetails: TransactionDetails[] | undefined
jest.mock('@safe-global/store/gateway/transactions', () => ({
  useTransactionsGetMultipleTransactionDetailsQuery: () => ({ data: mockTxDetails }),
}))

const mockUseTxQueue = jest.requireMock('@/hooks/useTxQueue').default as jest.Mock

const SAFE_NONCE = 5
const BATCHABLE_TOOLTIP = 'All highlighted transactions will be included in the batch execution.'
const NOT_BATCHABLE_TOOLTIP =
  'Batch execution is only available for transactions that have been fully signed and are strictly sequential in Safe account nonce.'
const ALL_SAFE_PAID_TOOLTIP =
  "Bulk execution is not available when all ready transactions pay fees from the Safe. You'd pay gas twice, once from the Safe and once from your signer wallet."

const queuedTx = (nonce: number, { signed }: { signed: boolean }): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType: 'None',
  transaction: safeTxSummaryBuilder()
    .with({
      timestamp: faker.date.recent().getTime(),
      executionInfo: executionInfoBuilder()
        .with({ nonce, confirmationsRequired: 2, confirmationsSubmitted: signed ? 2 : 1 })
        .build(),
    })
    .build(),
})

const detailsFor = (items: TransactionQueuedItem[], { safePaid }: { safePaid: boolean[] }) =>
  items.map((item, index) =>
    transactionDetailsBuilder()
      .with({
        txId: item.transaction.id,
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with(safePaid[index] ? { gasPrice: '1', baseGas: '21000' } : { gasPrice: '0' })
          .build(),
      })
      .build(),
  )

const setQueue = (items: TransactionQueuedItem[]) => {
  mockUseTxQueue.mockReturnValue({ page: { results: items }, loading: false })
}

const setTxFlow = jest.fn()

const renderButton = (options?: Parameters<typeof renderWithUserEvent>[1]) =>
  renderWithUserEvent(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <BatchExecuteButton />
    </TxModalContext.Provider>,
    options,
  )

const bulkButton = () => screen.getByRole('button', { name: /^Bulk execute/ })

const hoverButton = async (user: ReturnType<typeof renderButton>['user']) => {
  await user.hover(bulkButton().closest('span') as HTMLElement)
}

describe('BatchExecuteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ nonce: SAFE_NONCE })
    mockChainId('11155111')
    mockWallet()
  })

  it('offers to execute the fully signed transactions that follow the Safe nonce', async () => {
    const items = [queuedTx(5, { signed: true }), queuedTx(6, { signed: true })]
    setQueue(items)
    mockTxDetails = detailsFor(items, { safePaid: [false, false] })
    const { user } = renderButton()

    expect(bulkButton()).toHaveTextContent('Bulk execute 2 transactions')
    expect(bulkButton()).toBeEnabled()
    await hoverButton(user)
    expect(await screen.findByText(BATCHABLE_TOOLTIP)).toBeInTheDocument()
  })

  it('stops counting at the first transaction that is not fully signed', () => {
    const items = [
      queuedTx(5, { signed: true }),
      queuedTx(6, { signed: true }),
      queuedTx(7, { signed: false }),
      queuedTx(8, { signed: true }),
    ]
    setQueue(items)
    mockTxDetails = detailsFor(items.slice(0, 2), { safePaid: [false, false] })
    renderButton()

    expect(bulkButton()).toHaveTextContent('Bulk execute 2 transactions')
  })

  it('is disabled and explains why when the next transaction is not fully signed', async () => {
    setQueue([queuedTx(5, { signed: false }), queuedTx(6, { signed: true })])
    mockTxDetails = undefined
    const { user } = renderButton()

    expect(bulkButton()).toHaveTextContent(/^Bulk execute$/)
    expect(bulkButton()).toBeDisabled()
    await hoverButton(user)
    expect(await screen.findByText(NOT_BATCHABLE_TOOLTIP)).toBeInTheDocument()
  })

  it('opens the bulk execution flow with the ready transactions', async () => {
    const items = [queuedTx(5, { signed: true }), queuedTx(6, { signed: true })]
    setQueue(items)
    mockTxDetails = detailsFor(items, { safePaid: [false, false] })
    const { user } = renderButton()

    await user.click(bulkButton())

    const flow: ReactElement<{ txs: TransactionQueuedItem[] }> = setTxFlow.mock.lastCall[0]
    expect(flow.type).toBe(ExecuteBatchFlow)
    expect(flow.props.txs).toEqual(items)
  })

  it('is disabled without a connected wallet', () => {
    const items = [queuedTx(5, { signed: true }), queuedTx(6, { signed: true })]
    setQueue(items)
    mockTxDetails = detailsFor(items, { safePaid: [false, false] })
    mockWallet(null)
    renderButton()

    expect(bulkButton()).toBeDisabled()
  })

  it('is disabled while one of the ready transactions is pending', () => {
    const items = [queuedTx(5, { signed: true }), queuedTx(6, { signed: true })]
    setQueue(items)
    mockTxDetails = detailsFor(items, { safePaid: [false, false] })
    renderButton({ initialReduxState: { pendingTxs: { [items[0].transaction.id]: pendingTxBuilder().build() } } })

    expect(bulkButton()).toBeDisabled()
  })

  it('is disabled until the details of the ready transactions load', () => {
    setQueue([queuedTx(5, { signed: true }), queuedTx(6, { signed: true })])
    mockTxDetails = undefined
    renderButton()

    expect(bulkButton()).toBeDisabled()
  })

  it('is disabled and explains why when every ready transaction pays gas from the Safe', async () => {
    const items = [queuedTx(5, { signed: true }), queuedTx(6, { signed: true })]
    setQueue(items)
    mockTxDetails = detailsFor(items, { safePaid: [true, true] })
    const { user } = renderButton()

    expect(bulkButton()).toBeDisabled()
    await hoverButton(user)
    expect(await screen.findByText(ALL_SAFE_PAID_TOOLTIP)).toBeInTheDocument()
  })

  it('warns about paying gas twice before it opens a batch where some transactions pay from the Safe', async () => {
    const items = [queuedTx(5, { signed: true }), queuedTx(6, { signed: true })]
    setQueue(items)
    mockTxDetails = detailsFor(items, { safePaid: [true, false] })
    const { user } = renderButton()

    await user.click(bulkButton())

    expect(screen.getByText('Some transactions will be charged gas twice')).toBeInTheDocument()
    expect(setTxFlow).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Execute anyway' }))

    expect(setTxFlow.mock.lastCall[0].type).toBe(ExecuteBatchFlow)
  })
})
