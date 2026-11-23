import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getStoreInstance } from '@/store'
import { POLLING_INTERVAL } from '@/config/constants'
import * as useEffectiveSafeParamsHook from '@/hooks/useEffectiveSafeParams'
import { useIndexingTxWatcher } from '@/hooks/useIndexingTxWatcher'
import * as txEvents from '@/services/tx/txEvents'
import { PendingStatus, type PendingTxsState } from '@/store/pendingTxsSlice'
import { transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { getTransactionDetails } from '@/utils/tx-details'

jest.mock('@/utils/tx-details', () => ({ getTransactionDetails: jest.fn() }))

const CHAIN_ID = '11155111'
const SAFE_ADDRESS = faker.finance.ethereumAddress()
const TX_ID = `multisig_${SAFE_ADDRESS}_${faker.string.hexadecimal({ length: 64 })}`
const TX_HASH = faker.string.hexadecimal({ length: 64 })

const indexingTx = (): PendingTxsState => ({
  [TX_ID]: {
    chainId: CHAIN_ID,
    safeAddress: SAFE_ADDRESS,
    nonce: 4,
    groupKey: 'group',
    status: PendingStatus.INDEXING,
    txHash: TX_HASH,
  },
})

const txWithStatus = (txStatus: TransactionDetails['txStatus']) =>
  transactionDetailsBuilder().with({ txStatus }).build()

const loadSafe = (effectiveChainId: string, effectiveAddress: string) =>
  jest.spyOn(useEffectiveSafeParamsHook, 'default').mockReturnValue({ effectiveChainId, effectiveAddress })

describe('useIndexingTxWatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    loadSafe(CHAIN_ID, '')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should send SUCCESS with the pending tx, when an indexing tx of a Safe that is not loaded has left the queue', async () => {
    jest.mocked(getTransactionDetails).mockResolvedValue(txWithStatus('SUCCESS'))
    const dispatchSpy = jest.spyOn(txEvents, 'txDispatch')

    renderHook(() => useIndexingTxWatcher(), { initialReduxState: { pendingTxs: indexingTx() } })

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(txEvents.TxEvent.SUCCESS, {
        nonce: 4,
        txId: TX_ID,
        chainId: CHAIN_ID,
        safeAddress: SAFE_ADDRESS,
        groupKey: 'group',
        txHash: TX_HASH,
      }),
    )
    expect(getTransactionDetails).toHaveBeenCalledWith(CHAIN_ID, TX_ID)
  })

  it('should leave the tx to the history listener, when it belongs to the loaded Safe', () => {
    loadSafe(CHAIN_ID, SAFE_ADDRESS)

    renderHook(() => useIndexingTxWatcher(), { initialReduxState: { pendingTxs: indexingTx() } })

    expect(getTransactionDetails).not.toHaveBeenCalled()
  })

  it('should clear the pending tx without SUCCESS, when another transaction took its nonce', async () => {
    jest.mocked(getTransactionDetails).mockResolvedValue(txWithStatus('CANCELLED'))
    const dispatchSpy = jest.spyOn(txEvents, 'txDispatch')

    renderHook(() => useIndexingTxWatcher(), { initialReduxState: { pendingTxs: indexingTx() } })

    await waitFor(() => expect(getStoreInstance().getState().pendingTxs[TX_ID]).toBeUndefined())
    expect(dispatchSpy).not.toHaveBeenCalledWith(txEvents.TxEvent.SUCCESS, expect.anything())
  })

  it('should poll again after the polling interval, when the tx is still queued', async () => {
    jest.useFakeTimers()
    jest.mocked(getTransactionDetails).mockResolvedValue(txWithStatus('AWAITING_EXECUTION'))
    const dispatchSpy = jest.spyOn(txEvents, 'txDispatch')

    renderHook(() => useIndexingTxWatcher(), { initialReduxState: { pendingTxs: indexingTx() } })
    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLLING_INTERVAL)
    })

    expect(getTransactionDetails).toHaveBeenCalledTimes(2)
    expect(dispatchSpy).not.toHaveBeenCalledWith(txEvents.TxEvent.SUCCESS, expect.anything())
  })
})
