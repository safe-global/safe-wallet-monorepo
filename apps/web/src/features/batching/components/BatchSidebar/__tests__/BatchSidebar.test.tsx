import { type ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmBatchFlow, NewTxFlow } from '@/components/tx-flow/flows'
import { useDraftBatch } from '@/features/batching'
import type { DraftBatchItem } from '@/features/batching/store'
import BatchSidebar from '..'

const mockDeleteTx = jest.fn()

jest.mock('@/features/batching', () => ({
  useDraftBatch: jest.fn(),
  useUpdateBatch: () => [jest.fn(), mockDeleteTx],
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

jest.mock('../BatchTxList', () => ({
  __esModule: true,
  default({ txItems, onDelete }: { txItems: DraftBatchItem[]; onDelete: (id: string) => void }) {
    return txItems.map((item) => (
      <button key={item.id} onClick={() => onDelete(item.id)}>
        Delete {item.id}
      </button>
    ))
  },
}))

const mockUseDraftBatch = useDraftBatch as jest.MockedFunction<typeof useDraftBatch>

const draftItem = (): DraftBatchItem => ({
  id: faker.string.alphanumeric(10),
  timestamp: faker.date.recent().getTime(),
  txData: { to: faker.finance.ethereumAddress(), value: '1', data: '0x', operation: OperationType.Call },
})

const renderSidebar = () => {
  const setTxFlow = jest.fn()
  const onToggle = jest.fn()
  render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <BatchSidebar isOpen onToggle={onToggle} />
    </TxModalContext.Provider>,
  )
  return { setTxFlow, onToggle }
}

describe('BatchSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps the batch confirmation flow open when the batch is cleared after signing', () => {
    const setTxFlow = jest.fn()
    mockUseDraftBatch.mockReturnValue([])

    render(
      <TxModalContext.Provider
        value={{ txFlow: <ConfirmBatchFlow onSubmit={jest.fn()} />, setTxFlow, setFullWidth: jest.fn() }}
      >
        <BatchSidebar isOpen={false} onToggle={jest.fn()} />
      </TxModalContext.Provider>,
    )

    expect(setTxFlow).not.toHaveBeenCalled()
  })

  it('invites the user to add a first transaction to an empty batch', () => {
    mockUseDraftBatch.mockReturnValue([])

    renderSidebar()

    expect(screen.getByText('Add an initial transaction to the batch')).toBeInTheDocument()
  })

  it('opens a new transaction from the empty batch', () => {
    mockUseDraftBatch.mockReturnValue([])
    const { setTxFlow } = renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'New transaction' }))

    expect(setTxFlow).toHaveBeenCalledWith(expect.objectContaining({ type: NewTxFlow }), undefined, false)
  })

  it('lists every batched transaction and deletes the one the user removes', () => {
    const [first, second] = [draftItem(), draftItem()]
    mockUseDraftBatch.mockReturnValue([first, second])
    renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: `Delete ${second.id}` }))

    expect(screen.getByRole('button', { name: `Delete ${first.id}` })).toBeInTheDocument()
    expect(mockDeleteTx).toHaveBeenCalledWith(second.id)
  })

  it('adds another transaction to a batch that has some', () => {
    mockUseDraftBatch.mockReturnValue([draftItem()])
    const { setTxFlow } = renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Add new transaction' }))

    expect(setTxFlow).toHaveBeenCalledWith(expect.objectContaining({ type: NewTxFlow }), undefined, false)
  })

  it('closes the sidebar and opens the batch confirmation', () => {
    mockUseDraftBatch.mockReturnValue([draftItem(), draftItem()])
    const { setTxFlow, onToggle } = renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm batch' }))

    expect(onToggle).toHaveBeenCalledWith(false)
    expect(setTxFlow).toHaveBeenCalledWith(expect.objectContaining({ type: ConfirmBatchFlow }), undefined, false)
  })
})
