import { renderHook } from '@/tests/test-utils'
import { useHistoryFeesBreakdown } from '../useHistoryFeesBreakdown'
import * as useChainsModule from '@/hooks/useChains'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'

const mockMultisigTxDetails = {
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    baseGas: '21000',
    gasPrice: '20000000000',
    gasToken: '0x0000000000000000000000000000000000000000',
    safeTxGas: '0',
    refundReceiver: { value: '0x0000000000000000000000000000000000000000' },
    confirmations: [],
    confirmationsRequired: 2,
    confirmationsSubmitted: 2,
    nonce: 1,
    signers: [],
    submittedAt: 1700000000000,
  },
} as unknown as TransactionDetails

const mockModuleTxDetails = {
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MODULE,
  },
} as unknown as TransactionDetails

describe('useHistoryFeesBreakdown', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns a breakdown for multisig transactions when GTF is enabled', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useHistoryFeesBreakdown(mockMultisigTxDetails))

    expect(result.current).not.toBeNull()
  })

  it('returns null when GTF feature is disabled', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useHistoryFeesBreakdown(mockMultisigTxDetails))

    expect(result.current).toBeNull()
  })

  it('returns null when GTF feature is undefined (chain not loaded)', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(undefined)

    const { result } = renderHook(() => useHistoryFeesBreakdown(mockMultisigTxDetails))

    expect(result.current).toBeNull()
  })

  it('returns null for module-executed transactions', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useHistoryFeesBreakdown(mockModuleTxDetails))

    expect(result.current).toBeNull()
  })

  it('returns null when detailedExecutionInfo is null', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const txDetails = { detailedExecutionInfo: null } as unknown as TransactionDetails
    const { result } = renderHook(() => useHistoryFeesBreakdown(txDetails))

    expect(result.current).toBeNull()
  })
})
