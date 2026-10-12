import { renderHook } from '@testing-library/react'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { useRefetchOnTxEvents } from '../useRefetchOnTxEvents'

const detail = { txId: 'multisig_0x1_0xabc', nonce: 1 }

describe('useRefetchOnTxEvents', () => {
  it('should, when a listed tx event fires, refetch', () => {
    const refetch = jest.fn()
    renderHook(() => useRefetchOnTxEvents([TxEvent.PROPOSED], refetch, true))

    txDispatch(TxEvent.PROPOSED, { ...detail, chainId: '1', safeAddress: '0x1' })

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should, when disabled, not refetch a query that never started', () => {
    const refetch = jest.fn()
    renderHook(() => useRefetchOnTxEvents([TxEvent.PROPOSED], refetch, false))

    txDispatch(TxEvent.PROPOSED, { ...detail, chainId: '1', safeAddress: '0x1' })

    expect(refetch).not.toHaveBeenCalled()
  })

  it('should, after unmount, stop listening', () => {
    const refetch = jest.fn()
    const { unmount } = renderHook(() => useRefetchOnTxEvents([TxEvent.PROPOSED], refetch, true))
    unmount()

    txDispatch(TxEvent.PROPOSED, { ...detail, chainId: '1', safeAddress: '0x1' })

    expect(refetch).not.toHaveBeenCalled()
  })
})
