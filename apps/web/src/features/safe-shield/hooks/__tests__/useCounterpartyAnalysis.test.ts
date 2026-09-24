import { renderHook } from '@/tests/test-utils'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { useCounterpartyAnalysis } from '../useCounterpartyAnalysis'

const mockUtilsHook = jest.fn()
jest.mock('@safe-global/utils/features/safe-shield/hooks', () => ({
  useCounterpartyAnalysis: (args: unknown) => mockUtilsHook(args),
}))
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({ useWeb3ReadOnly: () => undefined }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: () => '0x1234567890123456789012345678901234567890',
}))
jest.mock('@/hooks/useOwnedSafes', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('@/hooks/useAllAddressBooks', () => ({ useMergedAddressBooks: () => ({ has: () => false }) }))

describe('useCounterpartyAnalysis', () => {
  const safeTx = safeTxBuilder().build()

  it('analyses the transaction by default', () => {
    renderHook(() => useCounterpartyAnalysis(safeTx))
    expect(mockUtilsHook).toHaveBeenLastCalledWith(expect.objectContaining({ safeTx }))
  })

  it('passes no transaction when disabled, so no analysis request is made', () => {
    renderHook(() => useCounterpartyAnalysis(safeTx, false))
    expect(mockUtilsHook).toHaveBeenLastCalledWith(expect.objectContaining({ safeTx: undefined }))
  })
})
