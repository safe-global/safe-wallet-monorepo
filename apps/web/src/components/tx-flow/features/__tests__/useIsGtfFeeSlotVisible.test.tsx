import { type ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useIsGtfFeeSlotVisible } from '../useIsGtfFeeSlotVisible'
import * as useChainsModule from '@/hooks/useChains'
import { SafeTxContext } from '../../SafeTxProvider'

const safeInterface = Safe__factory.createInterface()
const approveHashData = safeInterface.encodeFunctionData('approveHash', ['0x' + 'ab'.repeat(32)])

const makeSafeTx = (data: string): SafeTransaction =>
  ({ data: { to: '0x' + '11'.repeat(20), data, value: '0', operation: 0 }, signatures: new Map() }) as never

const withSafeTx = (safeTx?: SafeTransaction) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <SafeTxContext.Provider value={{ safeTx } as never}>{children}</SafeTxContext.Provider>
  )
  return Wrapper
}

describe('useIsGtfFeeSlotVisible', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('is visible for a normal tx on a GTF chain', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useIsGtfFeeSlotVisible(), {
      wrapper: withSafeTx(makeSafeTx('0xdeadbeef')),
    })

    expect(result.current).toBe(true)
  })

  it('is hidden for a nested approveHash (TX_P) even on a GTF chain', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useIsGtfFeeSlotVisible(), {
      wrapper: withSafeTx(makeSafeTx(approveHashData)),
    })

    expect(result.current).toBe(false)
  })

  it('is hidden when GTF is disabled regardless of tx', () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useIsGtfFeeSlotVisible(), {
      wrapper: withSafeTx(makeSafeTx('0xdeadbeef')),
    })

    expect(result.current).toBe(false)
  })
})
