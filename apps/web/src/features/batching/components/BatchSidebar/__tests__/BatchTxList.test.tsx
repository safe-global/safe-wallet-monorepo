import { act, render, waitFor } from '@/tests/test-utils'
import BatchTxList from '../BatchTxList'
import type { DraftBatchItem } from '../../../store/batchSlice'
import { OperationType } from '@safe-global/types-kit'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { createTx } from '@/services/tx/tx-sender'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'

jest.mock('@/hooks/coreSDK/safeCoreSDK', () => ({
  useSafeSDK: jest.fn(),
}))

jest.mock('@/services/tx/tx-sender', () => ({
  createTx: jest.fn(),
  createMultiSendCallOnlyTx: jest.fn(),
}))

jest.mock('@/components/tx/confirmation-views/useTxPreview', () => ({
  __esModule: true,
  default: jest.fn(() => [undefined, undefined, false]),
}))

const mockUseSafeSDK = useSafeSDK as jest.MockedFunction<typeof useSafeSDK>
const mockCreateTx = createTx as jest.MockedFunction<typeof createTx>
const mockUseTxPreview = useTxPreview as jest.MockedFunction<typeof useTxPreview>

// Enough of each shape for the component; the real types are far wider than this test needs.
const safeSdk = {} as Safe
const safeTx = { data: { to: '0xTo', value: '1', data: '0x', operation: OperationType.Call } } as SafeTransaction

const txItems: DraftBatchItem[] = [
  {
    id: '1',
    timestamp: 1,
    txData: { to: '0xTo', value: '1', data: '0x', operation: OperationType.Call },
  } as DraftBatchItem,
]

const previewOf = (to: string, value: string) =>
  ({
    txData: { hexData: null, dataDecoded: null, to: { value: to }, value, addressInfoIndex: null },
  }) as unknown as TransactionPreview

describe('BatchTxList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateTx.mockResolvedValue(safeTx)
  })

  it('does not build the batch tx while the Safe SDK is unavailable', async () => {
    mockUseSafeSDK.mockReturnValue(undefined)

    render(<BatchTxList txItems={txItems} />)

    // Flush effects first; waitFor on a negative assertion passes immediately and proves nothing.
    await act(async () => {
      await Promise.resolve()
    })
    expect(mockCreateTx).not.toHaveBeenCalled()
  })

  it('builds the batch tx once the Safe SDK becomes available', async () => {
    mockUseSafeSDK.mockReturnValue(undefined)

    const { rerender } = render(<BatchTxList txItems={txItems} />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(mockCreateTx).not.toHaveBeenCalled()

    // The SDK finishes initialising after the sidebar already rendered
    mockUseSafeSDK.mockReturnValue(safeSdk)
    rerender(<BatchTxList txItems={txItems} />)

    await waitFor(() => expect(mockCreateTx).toHaveBeenCalledTimes(1))
  })

  it('renders the decoded row once the preview resolves, not a skeleton', async () => {
    mockUseSafeSDK.mockReturnValue(safeSdk)
    mockUseTxPreview.mockReturnValue([previewOf('0xTo', '1'), undefined, false])

    const { getByTitle } = render(<BatchTxList txItems={txItems} onDelete={jest.fn()} />)

    // The delete control only exists on a decoded row, so this rules out the skeleton state.
    await waitFor(() => expect(getByTitle('Delete transaction')).toBeInTheDocument())
  })
})
