import { faker } from '@faker-js/faker'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { getTransactionQueue } from '@/services/transactions'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import useLoadTxQueue from '@/hooks/loadables/useLoadTxQueue'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/services/transactions')

const mockGetTransactionQueue = jest.mocked(getTransactionQueue)

const queuePage = (): QueuedItemPage => ({
  results: [{ type: 'TRANSACTION', conflictType: 'None', transaction: safeTxSummaryBuilder().build() }],
})

describe('useLoadTxQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads the queue of the current Safe', async () => {
    const safe = mockSafeInfo({ deployed: true })
    const page = queuePage()
    mockGetTransactionQueue.mockResolvedValue(page)

    const { result } = renderHook(() => useLoadTxQueue())

    await waitFor(() => expect(result.current[0]).toEqual(page))
    expect(mockGetTransactionQueue).toHaveBeenCalledWith(safe.chainId, safe.address.value)
  })

  it('reloads the queue when a transaction is deleted', async () => {
    mockSafeInfo({ deployed: true })
    const pageAfterDeletion = queuePage()
    mockGetTransactionQueue.mockResolvedValueOnce(queuePage()).mockResolvedValueOnce(pageAfterDeletion)
    const { result } = renderHook(() => useLoadTxQueue())
    await waitFor(() => expect(mockGetTransactionQueue).toHaveBeenCalledTimes(1))

    act(() => txDispatch(TxEvent.DELETED, { safeTxHash: faker.string.hexadecimal({ length: 64 }) }))

    await waitFor(() => expect(result.current[0]).toEqual(pageAfterDeletion))
    expect(mockGetTransactionQueue).toHaveBeenCalledTimes(2)
  })

  it('returns an empty queue without a request for an undeployed Safe', async () => {
    mockSafeInfo({ deployed: false })

    const { result } = renderHook(() => useLoadTxQueue())

    await waitFor(() => expect(result.current[0]).toEqual({ results: [] }))
    expect(mockGetTransactionQueue).not.toHaveBeenCalled()
  })
})
