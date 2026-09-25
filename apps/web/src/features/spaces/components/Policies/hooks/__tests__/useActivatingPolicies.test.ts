import { act, renderHook, waitFor } from '@testing-library/react'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { mockSpendingLimitDto } from '../../mocks/activePolicies'
import { MOCK_SAFES, mockPendingPolicy } from '../../mocks/policies'
import type { PendingSpendingLimitPolicy } from '../../types'
import { useActivatingPolicies } from '../useActivatingPolicies'

const mockGetTransaction = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useLazyTransactionsGetTransactionByIdV1Query: () => [mockGetTransaction],
}))

type Props = { pending: PendingSpendingLimitPolicy[]; dtos: ActivePolicyDto[]; resetKey: string; enabled: boolean }

const setup = (refetchActive = jest.fn()) => {
  const initialProps: Props = {
    pending: [mockPendingPolicy({ safe: MOCK_SAFES.treasury })],
    dtos: [mockSpendingLimitDto()],
    resetKey: 'space-1',
    enabled: true,
  }
  const hook = renderHook(
    ({ pending, dtos, resetKey, enabled }: Props) =>
      useActivatingPolicies(pending, dtos, { refetchActive, resetKey, enabled }),
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

  it('should, when the active policy changes in the same update the row leaves the queue, not hold it', async () => {
    const { result, rerender, initialProps } = setup()

    rerender({ ...initialProps, pending: [], dtos: [mockSpendingLimitDto({ enabled: false })] })
    await act(async () => {})

    expect(mockGetTransaction).toHaveBeenCalled()
    expect(result.current).toEqual([])
  })

  it('should, when the active policy changes while the lookup is in flight, not hold the row', async () => {
    let resolveLookup: (value: { data: { txStatus: string } }) => void = () => {}
    mockGetTransaction.mockReturnValue(new Promise((resolve) => (resolveLookup = resolve)))
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })

    rerender({ ...initialProps, pending: [], dtos: [mockSpendingLimitDto({ enabled: false })] })
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

  it('should, once the active policy for that Safe changes, release the held row', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    rerender({ ...initialProps, pending: [], dtos: [mockSpendingLimitDto({ enabled: false })] })

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
