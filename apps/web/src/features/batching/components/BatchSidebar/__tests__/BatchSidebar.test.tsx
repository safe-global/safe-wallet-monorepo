import { render } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmBatchFlow } from '@/components/tx-flow/flows'
import { useDraftBatch } from '@/features/batching'
import BatchSidebar from '..'

jest.mock('@/features/batching', () => ({
  useDraftBatch: jest.fn(),
  useUpdateBatch: () => [jest.fn(), jest.fn()],
}))

const mockUseDraftBatch = useDraftBatch as jest.MockedFunction<typeof useDraftBatch>

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
})
