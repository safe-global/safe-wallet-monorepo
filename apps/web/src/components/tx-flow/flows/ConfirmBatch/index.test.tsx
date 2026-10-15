import type { ComponentType } from 'react'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { fakerChecksummedAddress, render } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import { useDraftBatch, type DraftBatchItem } from '@/features/batching'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ConfirmBatchFlow from '.'

jest.mock('@/features/batching', () => ({ useDraftBatch: jest.fn() }))
jest.mock('@/services/tx/tx-sender', () => ({ createMultiSendCallOnlyTx: jest.fn(() => new Promise(() => {})) }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({ __esModule: true, default: () => null }))
jest.mock('../../TxFlow', () => ({
  TxFlow: ({ ReviewTransactionComponent }: { ReviewTransactionComponent: ComponentType<ReviewTransactionProps> }) => (
    <ReviewTransactionComponent onSubmit={() => {}} />
  ),
}))

const mockUseDraftBatch = useDraftBatch as jest.MockedFunction<typeof useDraftBatch>

const draftBatchItem = (): DraftBatchItem => ({
  id: faker.string.uuid(),
  timestamp: faker.date.recent().getTime(),
  txData: {
    to: fakerChecksummedAddress(),
    value: faker.string.numeric(),
    data: faker.string.hexadecimal({ length: 8, casing: 'lower' }),
    operation: OperationType.Call,
  },
})

describe('ConfirmBatchFlow', () => {
  const setTxFlow = jest.fn()

  const flow = () => (
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <ConfirmBatchFlow onSubmit={jest.fn()} />
    </TxModalContext.Provider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps the flow open while the batch has transactions', () => {
    mockUseDraftBatch.mockReturnValue([draftBatchItem(), draftBatchItem()])

    render(flow())

    expect(setTxFlow).not.toHaveBeenCalled()
  })

  it('closes the flow when the batch becomes empty on the review step', () => {
    mockUseDraftBatch.mockReturnValue([draftBatchItem()])
    const { rerender } = render(flow())

    mockUseDraftBatch.mockReturnValue([])
    rerender(flow())

    expect(setTxFlow).toHaveBeenCalledWith(undefined)
  })
})
