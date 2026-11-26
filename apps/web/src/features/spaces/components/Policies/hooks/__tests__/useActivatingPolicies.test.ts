import { act, renderHook, waitFor } from '@testing-library/react'
import {
  MOCK_SAFES,
  asActivePolicy,
  mockPendingPolicy,
  mockSpendingLimitPolicy,
} from '../../../../public/utils/policies'
import {
  mockActiveAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
} from '../../../../public/utils/allowlistPolicies'
import type { PendingSpendingLimitPolicy, Policy } from '@safe-global/views/features/spaces/components/Policies/types'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { getPendingTxId } from '../../utils/mapPendingPolicies'
import { MAX_HOLD_MS, useActivatingPolicies, type QueuedPolicy } from '../useActivatingPolicies'

const mockGetTransaction = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useLazyTransactionsGetTransactionByIdV1Query: () => [mockGetTransaction],
}))

type Signals = { executed: ReadonlySet<string>; failed: ReadonlySet<string>; leftQueue: ReadonlySet<string> }

type Props = {
  pending: PendingSpendingLimitPolicy[]
  active: Policy[]
  resetKey: string
  enabled: boolean
  signals: Signals
}

const NO_SIGNALS: Signals = { executed: new Set(), failed: new Set(), leftQueue: new Set() }

const NOT_INDEXED: Policy[] = [asActivePolicy(mockSpendingLimitPolicy({ data: { spenders: [] } }))]
const INDEXED: Policy[] = [asActivePolicy(mockSpendingLimitPolicy())]

const executedSignals = (row: QueuedPolicy): Signals => ({ ...NO_SIGNALS, executed: new Set([getPendingTxId(row)]) })

const leftQueueSignals = (row: QueuedPolicy): Signals => ({ ...NO_SIGNALS, leftQueue: new Set([getPendingTxId(row)]) })

const setup = (refetch = jest.fn()) => {
  const initialProps: Props = {
    pending: [mockPendingPolicy({ safe: MOCK_SAFES.treasury })],
    active: NOT_INDEXED,
    resetKey: 'space-1',
    enabled: true,
    signals: NO_SIGNALS,
  }
  const hook = renderHook(
    ({ pending, active, resetKey, enabled, signals }: Props) =>
      useActivatingPolicies(pending, active, { refetch, resetKey, enabled, signals }),
    { initialProps },
  )
  return { ...hook, refetch, initialProps, row: initialProps.pending[0] }
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

  it('should, while the indexer has not caught up for less than the hold limit, keep the held row', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    act(() => jest.advanceTimersByTime(MAX_HOLD_MS - 1_000))

    expect(result.current).toHaveLength(1)
  })

  it('should, after the hold limit without the indexer catching up, release the held row', async () => {
    const { result, rerender, initialProps } = setup()
    rerender({ ...initialProps, pending: [] })
    await waitFor(() => expect(result.current).toHaveLength(1))

    act(() => jest.advanceTimersByTime(MAX_HOLD_MS))

    expect(result.current).toEqual([])
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

  it("should, when an allowlist's queued apply executes and its row stays listed, hold it until the applied root leaves the row", async () => {
    const root = '0x1111111111111111111111111111111111111111111111111111111111111111'
    const live = mockActiveAllowlist()
    const queuedApply = mockPendingAllowlist({
      id: live.id,
      safe: live.safe,
      operation: 'update',
      step: 'apply',
      root,
    })
    const stillReadyToApply: Policy = {
      ...live,
      scheduledChange: { operation: 'update', appliesAt: 1_800_000_000, root },
    }
    const initialProps: { pending: QueuedPolicy[]; listed: Policy[] } = {
      pending: [queuedApply],
      listed: [queuedApply],
    }
    const { result, rerender } = renderHook(
      ({ pending, listed }: typeof initialProps) =>
        useActivatingPolicies(pending, listed, { refetch: jest.fn(), resetKey: 'space-1', enabled: true }),
      { initialProps },
    )

    rerender({ pending: [], listed: [stillReadyToApply] })
    await waitFor(() => expect(result.current).toEqual([{ ...queuedApply, status: 'activating' }]))
    rerender({ pending: [], listed: [live] })

    expect(result.current).toEqual([])
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

  it('should, when a fully signed allowlist setup executed while listed, show it as activating', () => {
    const setupRow = { ...mockFullySignedPendingAllowlist(), appliesOnExecution: true }

    const { result } = renderHook(() =>
      useActivatingPolicies([setupRow], [setupRow], {
        refetch: jest.fn(),
        resetKey: 'space-1',
        enabled: true,
        signals: executedSignals(setupRow),
      }),
    )

    expect(result.current).toEqual([{ ...setupRow, status: 'activating' }])
  })

  describe('while the row is still listed', () => {
    it('should, when a signal says its transaction executed, show it as activating without a lookup', () => {
      const { result, rerender, initialProps, row } = setup()

      rerender({ ...initialProps, signals: executedSignals(row) })

      expect(result.current).toEqual([{ ...row, status: 'activating' }])
      expect(mockGetTransaction).not.toHaveBeenCalled()
    })

    it('should, when its change is served while the pending policies still list it, keep it activating', () => {
      const { result, rerender, initialProps, row } = setup()
      rerender({ ...initialProps, signals: executedSignals(row) })

      rerender({ ...initialProps, signals: executedSignals(row), active: INDEXED })

      expect(result.current.map((policy) => policy.status)).toEqual(['activating'])
    })

    it('should, once the pending policies drop it and its change is served, release it', () => {
      const { result, rerender, initialProps, row } = setup()
      rerender({ ...initialProps, signals: executedSignals(row) })

      rerender({ ...initialProps, signals: executedSignals(row), pending: [], active: INDEXED })

      expect(result.current).toEqual([])
    })

    it('should, when the pending policies drop it before its change is served, keep it activating without a lookup', () => {
      const { result, rerender, initialProps, row } = setup()
      rerender({ ...initialProps, signals: executedSignals(row) })

      rerender({ ...initialProps, signals: executedSignals(row), pending: [] })

      expect(result.current.map((policy) => policy.status)).toEqual(['activating'])
      expect(mockGetTransaction).not.toHaveBeenCalled()
    })

    it('should, when its transaction reverts onchain, release it', () => {
      const { result, rerender, initialProps, row } = setup()
      rerender({ ...initialProps, signals: executedSignals(row) })

      act(() => {
        txDispatch(TxEvent.REVERTED, {
          txId: getPendingTxId(row),
          nonce: row.nonce,
          chainId: row.safe.chainId,
          safeAddress: row.safe.address,
          error: new Error('reverted'),
        })
      })

      expect(result.current).toEqual([])
    })

    it("should, when CGW's details say its transaction failed, release it", () => {
      const { result, rerender, initialProps, row } = setup()
      rerender({ ...initialProps, signals: executedSignals(row) })

      rerender({ ...initialProps, signals: { ...NO_SIGNALS, failed: new Set([getPendingTxId(row)]) } })

      expect(result.current).toEqual([])
    })

    it('should, once its hold ran out, not hold it again while the signal stays on', () => {
      const { result, rerender, initialProps, row } = setup()
      rerender({ ...initialProps, signals: executedSignals(row) })
      act(() => jest.advanceTimersByTime(MAX_HOLD_MS))

      rerender({ ...initialProps, signals: executedSignals(row) })

      expect(result.current).toEqual([])
    })
  })

  describe('when its transaction leaves the Space queue', () => {
    it('should, when its details say it executed, show it as activating and refetch the policies', async () => {
      const { result, rerender, initialProps, refetch, row } = setup()

      rerender({ ...initialProps, signals: leftQueueSignals(row) })

      await waitFor(() => expect(result.current).toEqual([{ ...row, status: 'activating' }]))
      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['it was deleted', { error: { status: 404 } }],
      ['another transaction replaced it', { data: { txStatus: 'CANCELLED' } }],
      ['its details cannot be read', { error: { status: 500 } }],
    ])('should, when %s, keep it as listed', async (_, lookup) => {
      mockGetTransaction.mockResolvedValue(lookup)
      const { result, rerender, initialProps, row } = setup()

      rerender({ ...initialProps, signals: leftQueueSignals(row) })
      await act(async () => {})

      expect(mockGetTransaction).toHaveBeenCalledTimes(1)
      expect(result.current).toEqual([])
    })

    it('should look its transaction up once, however often the queue is read again', async () => {
      const { rerender, initialProps, row } = setup()
      rerender({ ...initialProps, signals: leftQueueSignals(row) })
      await act(async () => {})

      rerender({ ...initialProps, signals: leftQueueSignals(row) })
      await act(async () => {})

      expect(mockGetTransaction).toHaveBeenCalledTimes(1)
    })

    it('should, while the policy queries are skipped, neither look it up nor refetch', async () => {
      const { rerender, initialProps, refetch, row } = setup()

      rerender({ ...initialProps, enabled: false, signals: leftQueueSignals(row) })
      await act(async () => {})

      expect(mockGetTransaction).not.toHaveBeenCalled()
      expect(refetch).not.toHaveBeenCalled()
    })
  })
})
