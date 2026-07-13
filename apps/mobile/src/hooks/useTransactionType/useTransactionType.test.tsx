import { renderHook } from '@/src/tests/test-utils'
import { useTransactionType } from '.'
import { mockTransactionSummary, mockTransferWithInfo } from '@/src/tests/mocks'
import { TransactionInfoType, TransactionStatus, TransferDirection } from '@safe-global/store/gateway/types'

describe('useTransactionType', () => {
  it('should be a Received transaction', () => {
    const { result } = renderHook(() => useTransactionType(mockTransactionSummary))

    expect(result.current.text).toBe('Received')
  })

  it('should be a Creation transaction', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.CREATION,
        }),
      }),
    )

    expect(result.current.text).toBe('Safe account created')
  })

  it('should be a outgoing transfer transaction', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.TRANSFER,
          direction: TransferDirection.OUTGOING,
        }),
      }),
    )

    expect(result.current.text).toBe('Sent')
  })

  it('should be a outgoing transfer transaction awaiting for execution', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.AWAITING_EXECUTION,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.TRANSFER,
          direction: TransferDirection.OUTGOING,
        }),
      }),
    )

    expect(result.current.text).toBe('Send')
  })

  it('should return the type for a SETTINGS_CHANGE transaction', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.SETTINGS_CHANGE,
        }),
      }),
    )

    expect(result.current.text).toBe('mockMethod')
  })

  it('should return the type for a SWAP_ORDER transaction', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.SWAP_ORDER,
        }),
      }),
    )

    expect(result.current.text).toBe('Swap order')
  })

  it('should return the type for a TWAP_ORDER transaction', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.TWAP_ORDER,
        }),
      }),
    )

    expect(result.current.text).toBe('TWAP order')
  })

  it('should return the type for a CUSTOM transaction', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.CUSTOM,
        }),
      }),
    )

    expect(result.current.text).toBe('Contract interaction')
  })

  it('should return a `Batch` text for a CUSTOM batch transaction', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: mockTransferWithInfo({
          type: TransactionInfoType.CUSTOM,
          methodName: 'multiSend',
          actionCount: 2,
        }),
        safeAppInfo: undefined,
      }),
    )

    expect(result.current.text).toBe('Batch')
  })

  it('should return the default transaction information', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: mockTransferWithInfo({
          type: 'something else' as TransactionInfoType,
        }),
        safeAppInfo: undefined,
      }),
    )

    expect(result.current.text).toBe('Contract interaction')
  })

  it('should return the default transaction information with safe information', () => {
    const { result } = renderHook(() =>
      useTransactionType({
        ...mockTransactionSummary,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: mockTransferWithInfo({
          type: 'something else' as TransactionInfoType,
        }),
        safeAppInfo: {
          name: 'somename',
          url: 'http://google.com',
          logoUri: 'myurl.com',
        },
      }),
    )

    expect(result.current.text).toBe('somename')
  })
})
