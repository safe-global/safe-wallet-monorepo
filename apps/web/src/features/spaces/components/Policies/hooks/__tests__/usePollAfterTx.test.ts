import { act, renderHook } from '@testing-library/react'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { POLL_AFTER_TX_MS, usePollAfterTx } from '../usePollAfterTx'

const EVENTS = [TxEvent.PROCESSED]

const processTx = () =>
  act(() => {
    txDispatch(TxEvent.PROCESSED, {
      txId: 'multisig_0x1_0xabc',
      nonce: 1,
      chainId: '1',
      safeAddress: '0x1',
      txHash: '0xhash',
    })
  })

describe('usePollAfterTx', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should not poll, when no transaction event has fired', () => {
    const { result } = renderHook(() => usePollAfterTx(EVENTS, true))

    expect(result.current).toBe(false)
  })

  it('should poll, when a transaction event fires', () => {
    const { result } = renderHook(() => usePollAfterTx(EVENTS, true))

    processTx()

    expect(result.current).toBe(true)
  })

  it('should stop polling, when the window after the last event is over', () => {
    const { result } = renderHook(() => usePollAfterTx(EVENTS, true))

    processTx()
    act(() => {
      jest.advanceTimersByTime(POLL_AFTER_TX_MS)
    })

    expect(result.current).toBe(false)
  })

  it('should restart the window, when another event fires before it is over', () => {
    const { result } = renderHook(() => usePollAfterTx(EVENTS, true))

    processTx()
    act(() => {
      jest.advanceTimersByTime(POLL_AFTER_TX_MS - 1)
    })
    processTx()
    act(() => {
      jest.advanceTimersByTime(POLL_AFTER_TX_MS - 1)
    })

    expect(result.current).toBe(true)
  })

  it('should not poll, when it is disabled', () => {
    const { result } = renderHook(() => usePollAfterTx(EVENTS, false))

    processTx()

    expect(result.current).toBe(false)
  })
})
