import { act, renderHook, waitFor } from '@testing-library/react'
import { MOCK_SAFES, asActivePolicy, mockPendingPolicy, mockSpendingLimitPolicy } from '../../mocks/policies'
import type { PendingSpendingLimitPolicy, Policy } from '../../types'
import { useActivatingPolicies } from '../useActivatingPolicies'

const mockGetTransaction = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useLazyTransactionsGetTransactionByIdV1Query: () => [mockGetTransaction],
}))

type Props = { pending: PendingSpendingLimitPolicy[]; active: Policy[]; resetKey: string; enabled: boolean }

const NOT_INDEXED: Policy[] = [asActivePolicy(mockSpendingLimitPolicy({ data: { spenders: [] } }))]
const INDEXED: Policy[] = [asActivePolicy(mockSpendingLimitPolicy())]

const setup = (refetchActive = jest.fn()) => {
  const initialProps: Props = {
    pending: [mockPendingPolicy({ safe: MOCK_SAFES.treasury })],
    active: NOT_INDEXED,
    resetKey: 'space-1',
    enabled: true,
  }
  const hook = renderHook(
    ({ pending, active, resetKey, enabled }: Props) =>
      useActivatingPolicies(pending, active, { refetchActive, resetKey, enabled }),
    { initialProps },
  )
  return { ...hook, refetchActive, initialProps }
}

describe('useActivatingPolicies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockGetTransaction.mockResolvedValue({ data: { txStatus: 'SUCCESS' } })
  })

  afterEach(() => jest.useRealTimers())

  it('should, when a pending row leaves the queue because it executed, hold it as activating', async () => {
    const { result, rerender, initialProps } = setup()

    rerender({ ...initialProps, pending: [] })

    await waitFor(() => expect(result.current.map((row) => row.status)).toEqual(['activating']))
  })

  it('should, when a pending row leaves the queue because it was deleted, drop it', async () => {
    mockGetTransaction.mockResolvedValue({ error: { status: 404 } })
    const { result, rerender, initialProps } = setup()

    rerender({ ...initialProps, pending: [] })

    await act(async () => {})

    expect(mockGetTransaction).toHaveBeenCalled()
    expect(result.current).toEqual([])
  })

  it('should, when the transaction left the queue without executing, drop it', async () => {
    mockGetTransaction.mockResolvedValue({ data: { txStatus: 'AWAITING_CONFIRMATIONS' } })
    const { result, rerender, initialProps } = setup()

    rerender({ ...initialProps, pending: [] })

    await act(async () => {})

    expect(mockGetTransaction).toHaveBeenCalled()
    expect(result.current).toEqual([])
  })

  it('should, when the transaction lookup fails, still hold the row as activating', async () => {
    mockGetTransaction.mockResolvedValue({ error: { status: 500 } })
    const { result, rerender, initialProps } = setup()

    rerender({ ...initialProps, pending: [] })

    await waitFor(() => expect(result.current.map((row) => row.status)).toEqual(['activating']))
  })

  it('should, when the change is indexed in the same update the row leaves the queue, not hold it', async () => {
    const { result, rerender, initialProps } = setup()

    rerender({ ...initialProps, pending: [], active: INDEXED })
    await act(async () => {})

    expect(mockGetTransaction).toHaveBeenCalled()
    expect(result.current).toEqual([])
  })

  it('should, when the change is indexed while the lookup is in flight, not hold the row', async () => {
    let resolveLookup: (value: { data: { txStatus: string } }) => void = () => {}
    mockGetTransaction.mockReturnValue(new Promise((resolve) => (resolveLookup = resolve)))
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })

    rerender({ ...initialProps, pending: [], active: INDEXED })
    await act(async () => resolveLookup({ data: { txStatus: 'SUCCESS' } }))

    expect(result.current).toEqual([])
  })

  it('should, when the same transaction leaves the queue twice, hold it once', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    rerender(initialProps)
    rerender({ ...initialProps, pending: [] })
    await act(async () => {})

    expect(mockGetTransaction).toHaveBeenCalledTimes(2)
    expect(result.current).toHaveLength(1)
  })

  it('should, when the change was indexed a render before the row left the queue, not hold it', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, active: INDEXED })

    rerender({ ...initialProps, active: INDEXED, pending: [] })
    await act(async () => {})

    expect(mockGetTransaction).toHaveBeenCalled()
    expect(result.current).toEqual([])
  })

  it('should, when an unrelated change reaches the active rows, keep holding the row', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    rerender({
      ...initialProps,
      pending: [],
      active: [asActivePolicy(mockSpendingLimitPolicy({ enabled: false, data: { spenders: [] } }))],
    })

    expect(result.current).toHaveLength(1)
  })

  it('should, once the active rows show the change, release the held row', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    rerender({ ...initialProps, pending: [], active: INDEXED })

    expect(result.current).toEqual([])
  })

  it('should, after five minutes without the indexer catching up, release the held row', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    act(() => jest.advanceTimersByTime(5 * 60_000))

    expect(result.current).toEqual([])
  })

  it('should, while a row is held, refetch active every 15 seconds', async () => {
    const { result, rerender, initialProps, refetchActive } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    act(() => jest.advanceTimersByTime(30_000))

    expect(refetchActive).toHaveBeenCalledTimes(2)
  })

  it('should, when one transaction changes two modules, hold both rows', async () => {
    const { result, rerender, initialProps } = setup()
    const [allowanceRow] = initialProps.pending
    const otherModuleRow = mockPendingPolicy({
      id: 'pending:other-module',
      safe: MOCK_SAFES.treasury,
      enforcement: { via: 'module', moduleAddress: '0x0000000000000000000000000000000000000001' },
    })
    rerender({ ...initialProps, pending: [allowanceRow, otherModuleRow] })

    rerender({ ...initialProps, pending: [] })

    await waitFor(() => expect(result.current.map((row) => row.id)).toEqual([allowanceRow.id, otherModuleRow.id]))
  })

  it('should, when the space changes, clear the held rows', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    rerender({ ...initialProps, pending: [], resetKey: 'space-2' })

    expect(result.current).toEqual([])
  })

  it('should, when the space changes while the lookup is in flight, not hold the row', async () => {
    let resolveLookup: (value: { data: { txStatus: string } }) => void = () => {}
    mockGetTransaction.mockReturnValue(new Promise((resolve) => (resolveLookup = resolve)))
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })

    rerender({ ...initialProps, pending: [], resetKey: 'space-2' })
    await act(async () => resolveLookup({ data: { txStatus: 'SUCCESS' } }))

    expect(result.current).toEqual([])
  })

  it('should, while disabled, not refetch active', async () => {
    const { result, rerender, initialProps, refetchActive } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    rerender({ ...initialProps, pending: [], enabled: false })
    act(() => jest.advanceTimersByTime(30_000))

    expect(refetchActive).not.toHaveBeenCalled()
  })
})
