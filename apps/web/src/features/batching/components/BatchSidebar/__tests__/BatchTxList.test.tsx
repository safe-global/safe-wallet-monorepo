import { render, waitFor } from '@/tests/test-utils'
import BatchTxList from '../BatchTxList'
import type { DraftBatchItem } from '../../../store/batchSlice'
import { OperationType } from '@safe-global/types-kit'
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

const txItems: DraftBatchItem[] = [
  {
    id: '1',
    timestamp: 1,
    txData: { to: '0xTo', value: '1', data: '0x', operation: OperationType.Call },
  } as DraftBatchItem,
]

describe('BatchTxList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTxPreview.mockReturnValue([undefined, undefined, false])
    mockCreateTx.mockResolvedValue({ data: { to: '0xTo' } } as never)
  })

  it('does not build the batch tx while the Safe SDK is unavailable', async () => {
    mockUseSafeSDK.mockReturnValue(undefined as never)

    render(<BatchTxList txItems={txItems} />)

    await waitFor(() => expect(mockCreateTx).not.toHaveBeenCalled())
  })

  it('builds the batch tx once the Safe SDK becomes available', async () => {
    mockUseSafeSDK.mockReturnValue(undefined as never)

    const { rerender } = render(<BatchTxList txItems={txItems} />)
    await waitFor(() => expect(mockCreateTx).not.toHaveBeenCalled())

    // The SDK finishes initialising after the sidebar already rendered
    mockUseSafeSDK.mockReturnValue({} as never)
    rerender(<BatchTxList txItems={txItems} />)

    await waitFor(() => expect(mockCreateTx).toHaveBeenCalledTimes(1))
  })
})
