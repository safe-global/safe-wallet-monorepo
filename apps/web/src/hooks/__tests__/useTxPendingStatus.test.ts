import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import useTxPendingStatuses, { useTxMonitor } from '@/hooks/useTxPendingStatuses'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import * as txMonitor from '@/services/tx/txMonitor'
import {
  clearPendingTx,
  PendingStatus,
  type PendingTxsState,
  PendingTxType,
  setPendingTx,
} from '@/store/pendingTxsSlice'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { act, renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { SimpleTxWatcher } from '@/utils/SimpleTxWatcher'
import type { JsonRpcProvider } from 'ethers'

const TEST_CHAIN_ID = '11155111'
const TEST_SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'

describe('useTxMonitor', () => {
  let mockProvider
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useChainIdHook, 'default').mockReturnValue(TEST_CHAIN_ID)

    mockProvider = jest.fn() as unknown as JsonRpcProvider
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(mockProvider)
  })

  it('should not monitor transactions if provider is not available', () => {
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(undefined)
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx')
    const mockWaitForRelayedTx = jest.spyOn(txMonitor, 'waitForRelayedTx')

    renderHook(() => useTxMonitor())

    expect(mockWaitForTx).not.toHaveBeenCalled()
    expect(mockWaitForRelayedTx).not.toHaveBeenCalled()
  })

  it('should not monitor transactions if there are no pending transactions', () => {
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx')
    const mockWaitForRelayedTx = jest.spyOn(txMonitor, 'waitForRelayedTx')

    renderHook(() => useTxMonitor, { initialReduxState: { pendingTxs: {} } })

    expect(mockWaitForTx).not.toHaveBeenCalled()
    expect(mockWaitForRelayedTx).not.toHaveBeenCalled()
  })

  it('should monitor processing transactions', () => {
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx')
    const mockWaitForRelayedTx = jest.spyOn(txMonitor, 'waitForRelayedTx')

    const pendingTx: PendingTxsState = {
      '123': pendingTxBuilder().with({ chainId: '11155111', status: PendingStatus.PROCESSING }).build(),
    }

    renderHook(() => useTxMonitor(), { initialReduxState: { pendingTxs: pendingTx } })

    expect(mockWaitForTx).toHaveBeenCalled()
    expect(mockWaitForRelayedTx).not.toHaveBeenCalled()
  })

  it('should monitor relaying transactions', () => {
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx')
    const mockWaitForRelayedTx = jest.spyOn(txMonitor, 'waitForRelayedTx')

    const pendingTx: PendingTxsState = {
      '123': pendingTxBuilder().with({ chainId: '11155111', status: PendingStatus.RELAYING }).build(),
    }

    renderHook(() => useTxMonitor(), { initialReduxState: { pendingTxs: pendingTx } })

    expect(mockWaitForRelayedTx).toHaveBeenCalled()
    expect(mockWaitForTx).not.toHaveBeenCalled()
  })

  it('should not monitor already monitored transactions', () => {
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx')

    const pendingTxs: PendingTxsState = {
      '123': pendingTxBuilder().with({ chainId: '11155111', status: PendingStatus.PROCESSING }).build(),
    }

    const { rerender } = renderHook(() => useTxMonitor(), { initialReduxState: { pendingTxs } })

    rerender()

    expect(mockWaitForTx).toHaveBeenCalledTimes(1)
  })
})

jest.mock('@/store/pendingTxsSlice', () => {
  const original = jest.requireActual('@/store/pendingTxsSlice')
  return {
    ...original,
    setPendingTx: jest.fn(original.setPendingTx),
    clearPendingTx: jest.fn(original.clearPendingTx),
  }
})

const extendedSafeInfo = extendedSafeInfoBuilder().build()

describe('useTxPendingStatuses', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useChainIdHook, 'default').mockReturnValue('11155111')
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: extendedSafeInfo,
      safeAddress: faker.finance.ethereumAddress(),
      safeError: undefined,
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('should update pending tx when SIGNATURE_PROPOSED', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'
    const mockSignerAddress = faker.finance.ethereumAddress()

    txDispatch(TxEvent.SIGNATURE_PROPOSED, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
      signerAddress: mockSignerAddress,
    })

    expect(setPendingTx).toHaveBeenCalledWith({
      nonce: 1,
      chainId: expect.anything(),
      safeAddress: expect.anything(),
      signerAddress: mockSignerAddress,
      status: PendingStatus.SIGNING,
      txId: mockTxId,
    })
  })

  it('should update custom pending tx when PROCESSING', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'
    const mockTxHash = '0x123'
    const mockNonce = 1
    const mockData = '0x456'
    const mockSignerAddress = faker.finance.ethereumAddress()
    const mockTo = faker.finance.ethereumAddress()

    txDispatch(TxEvent.PROCESSING, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
      txHash: mockTxHash,
      signerNonce: mockNonce,
      signerAddress: mockSignerAddress,
      txType: 'Custom',
      data: mockData,
      to: mockTo,
    })

    expect(setPendingTx).toHaveBeenCalledWith({
      nonce: 1,
      chainId: expect.anything(),
      safeAddress: expect.anything(),
      submittedAt: expect.anything(),
      signerAddress: mockSignerAddress,
      signerNonce: mockNonce,
      to: mockTo,
      data: mockData,
      status: PendingStatus.PROCESSING,
      txId: mockTxId,
      txHash: mockTxHash,
      txType: PendingTxType.CUSTOM_TX,
    })
  })

  it('should update pending safe tx when PROCESSING', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'
    const mockTxHash = '0x123'
    const mockNonce = 1
    const mockGasLimit = '80000'
    const mockSignerAddress = faker.finance.ethereumAddress()

    txDispatch(TxEvent.PROCESSING, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
      txHash: mockTxHash,
      signerNonce: mockNonce,
      signerAddress: mockSignerAddress,
      txType: 'SafeTx',
      gasLimit: mockGasLimit,
    })

    expect(setPendingTx).toHaveBeenCalledWith({
      nonce: 1,
      chainId: expect.anything(),
      safeAddress: expect.anything(),
      submittedAt: expect.anything(),
      signerAddress: mockSignerAddress,
      signerNonce: mockNonce,
      gasLimit: mockGasLimit,
      status: PendingStatus.PROCESSING,
      txId: mockTxId,
      txHash: mockTxHash,
      txType: PendingTxType.SAFE_TX,
    })
  })

  it('should update pending tx when EXECUTING', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'

    txDispatch(TxEvent.EXECUTING, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
    })

    expect(setPendingTx).toHaveBeenCalledWith({
      nonce: 1,
      chainId: expect.anything(),
      safeAddress: expect.anything(),
      status: PendingStatus.SUBMITTING,
      txId: mockTxId,
    })
  })

  it('should update pending tx when PROCESSED', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'

    txDispatch(TxEvent.PROCESSED, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
    })

    expect(setPendingTx).toHaveBeenCalledWith({
      nonce: 1,
      chainId: expect.anything(),
      safeAddress: expect.anything(),
      status: PendingStatus.INDEXING,
      txId: mockTxId,
    })
  })

  it('should update pending tx when RELAYING', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'
    const mockTaskId = '0x123'

    txDispatch(TxEvent.RELAYING, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
      taskId: mockTaskId,
    })

    expect(setPendingTx).toHaveBeenCalledWith({
      nonce: 1,
      chainId: expect.anything(),
      safeAddress: expect.anything(),
      status: PendingStatus.RELAYING,
      txId: mockTxId,
      taskId: mockTaskId,
    })
  })

  it('should clear the pending tx on SUCCESS', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'

    txDispatch(TxEvent.SUCCESS, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
    })

    expect(setPendingTx).not.toHaveBeenCalled()
    expect(clearPendingTx).toHaveBeenCalled()
  })

  it('should clear the pending tx on SIGNATURE_INDEXED', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'

    txDispatch(TxEvent.SIGNATURE_INDEXED, {
      txId: mockTxId,
    })

    expect(setPendingTx).not.toHaveBeenCalled()
    expect(clearPendingTx).toHaveBeenCalled()
  })

  it('should clear the pending tx on REVERTED', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'

    txDispatch(TxEvent.REVERTED, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
      error: new Error('Transaction reverted'),
    })

    expect(setPendingTx).not.toHaveBeenCalled()
    expect(clearPendingTx).toHaveBeenCalled()
  })

  it('should clear the pending tx on FAILED', () => {
    renderHook(() => useTxPendingStatuses())

    const mockTxId = '123'

    txDispatch(TxEvent.FAILED, {
      nonce: 1,
      txId: mockTxId,
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
      error: new Error('Transaction failed'),
    })

    expect(setPendingTx).not.toHaveBeenCalled()
    expect(clearPendingTx).toHaveBeenCalled()
  })
})

describe('useTxMonitor with live transaction events', () => {
  const TX_ID = 'multisig_0xabc'
  const FIRST_HASH = '0x1111111111111111111111111111111111111111111111111111111111111111'
  const SPED_UP_HASH = '0x2222222222222222222222222222222222222222222222222222222222222222'
  const signerAddress = faker.finance.ethereumAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    // The pending txs slice is persisted, so leftovers would be rehydrated into the next test
    localStorage.clear()

    jest.spyOn(useChainIdHook, 'default').mockReturnValue(TEST_CHAIN_ID)
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(jest.fn() as unknown as JsonRpcProvider)
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: { ...extendedSafeInfoBuilder().build(), chainId: TEST_CHAIN_ID },
      safeAddress: TEST_SAFE_ADDRESS,
      safeError: undefined,
      safeLoaded: true,
      safeLoading: false,
    })
  })

  const dispatchExecuting = () =>
    act(() => {
      txDispatch(TxEvent.EXECUTING, {
        nonce: 1,
        txId: TX_ID,
        chainId: TEST_CHAIN_ID,
        safeAddress: TEST_SAFE_ADDRESS,
      })
    })

  const dispatchProcessing = (txHash: string) =>
    act(() => {
      txDispatch(TxEvent.PROCESSING, {
        nonce: 1,
        txId: TX_ID,
        chainId: TEST_CHAIN_ID,
        safeAddress: TEST_SAFE_ADDRESS,
        txHash,
        signerNonce: 7,
        signerAddress,
        txType: 'SafeTx',
        gasLimit: '50000',
      })
    })

  it('starts watching a tx already tracked as SIGNING when it starts processing', () => {
    // The production repro: `SIGNATURE_PROPOSED` (sign-then-execute) or a rehydrated persisted entry
    // already holds this txId, so executing it replaces that entry instead of adding one. Both
    // dispatches land in the same tick, exactly like `dispatchTxExecution` does.
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx').mockResolvedValue(undefined)

    const pendingTxs: PendingTxsState = {
      [TX_ID]: {
        chainId: TEST_CHAIN_ID,
        safeAddress: TEST_SAFE_ADDRESS,
        nonce: 1,
        status: PendingStatus.SIGNING,
        signerAddress,
      },
    }

    renderHook(() => useTxPendingStatuses(), { initialReduxState: { pendingTxs } })

    act(() => {
      txDispatch(TxEvent.EXECUTING, {
        nonce: 1,
        txId: TX_ID,
        chainId: TEST_CHAIN_ID,
        safeAddress: TEST_SAFE_ADDRESS,
      })
      txDispatch(TxEvent.PROCESSING, {
        nonce: 1,
        txId: TX_ID,
        chainId: TEST_CHAIN_ID,
        safeAddress: TEST_SAFE_ADDRESS,
        txHash: FIRST_HASH,
        signerNonce: 7,
        signerAddress,
        txType: 'SafeTx',
        gasLimit: '50000',
      })
    })

    expect(mockWaitForTx).toHaveBeenCalledTimes(1)
    expect(mockWaitForTx).toHaveBeenCalledWith(
      expect.anything(),
      [TX_ID],
      FIRST_HASH,
      TEST_SAFE_ADDRESS,
      signerAddress,
      7,
      1,
      TEST_CHAIN_ID,
    )
  })

  it('starts watching a tx whose processing status only arrives in a later render', () => {
    // Not the ordinary execute path: `dispatchTxExecution` emits EXECUTING and PROCESSING in the
    // same tick, and React batches them into one render, so from an empty store the entry is
    // already PROCESSING by the time the effect runs. This covers callers that let a render happen
    // in between, leaving the entry at SUBMITTING for one render.
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx').mockResolvedValue(undefined)

    renderHook(() => useTxPendingStatuses())

    dispatchExecuting()
    expect(mockWaitForTx).not.toHaveBeenCalled()

    dispatchProcessing(FIRST_HASH)

    expect(mockWaitForTx).toHaveBeenCalledTimes(1)
    expect(mockWaitForTx).toHaveBeenCalledWith(
      expect.anything(),
      [TX_ID],
      FIRST_HASH,
      TEST_SAFE_ADDRESS,
      signerAddress,
      7,
      1,
      TEST_CHAIN_ID,
    )
  })

  it('does not watch the same attempt twice', () => {
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx').mockResolvedValue(undefined)

    renderHook(() => useTxPendingStatuses())

    dispatchProcessing(FIRST_HASH)
    dispatchProcessing(FIRST_HASH)

    expect(mockWaitForTx).toHaveBeenCalledTimes(1)
  })

  it('watches the new hash and stops the replaced one when the tx is sped up', () => {
    const mockWaitForTx = jest.spyOn(txMonitor, 'waitForTx').mockResolvedValue(undefined)
    const mockStopWatching = jest.spyOn(SimpleTxWatcher.getInstance(), 'stopWatchingTxHash').mockResolvedValue()

    renderHook(() => useTxPendingStatuses())

    dispatchProcessing(FIRST_HASH)
    dispatchProcessing(SPED_UP_HASH)

    expect(mockStopWatching).toHaveBeenCalledWith(FIRST_HASH)
    expect(mockWaitForTx).toHaveBeenCalledTimes(2)
    expect(mockWaitForTx).toHaveBeenLastCalledWith(
      expect.anything(),
      [TX_ID],
      SPED_UP_HASH,
      TEST_SAFE_ADDRESS,
      signerAddress,
      7,
      1,
      TEST_CHAIN_ID,
    )
  })
})
