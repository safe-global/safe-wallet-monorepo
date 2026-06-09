import * as useAllSafes from '../useAllSafes'
import useGetIsSafeAddress from '../useIsSafeAddress'
import type { SafeItem } from '../useAllSafes'
import { renderHook } from '@/tests/test-utils'

const safeItem = (chainId: string, address: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

describe('useGetIsSafeAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns false when there are no known safes', () => {
    jest.spyOn(useAllSafes, 'default').mockReturnValue(undefined)

    const { result } = renderHook(() => useGetIsSafeAddress())

    expect(result.current('0x1234567890123456789012345678901234567890')).toBe(false)
  })

  it('returns false for an empty address', () => {
    jest.spyOn(useAllSafes, 'default').mockReturnValue([safeItem('1', '0xabc')])

    const { result } = renderHook(() => useGetIsSafeAddress())

    expect(result.current('')).toBe(false)
  })

  it('matches a known safe on any chain when no chainId is given', () => {
    jest.spyOn(useAllSafes, 'default').mockReturnValue([safeItem('1', '0xAbC'), safeItem('137', '0xDeF')])

    const { result } = renderHook(() => useGetIsSafeAddress())

    expect(result.current('0xabc')).toBe(true)
    expect(result.current('0xdef')).toBe(true)
    expect(result.current('0x999')).toBe(false)
  })

  it('is case-insensitive', () => {
    jest.spyOn(useAllSafes, 'default').mockReturnValue([safeItem('1', '0xabcdef')])

    const { result } = renderHook(() => useGetIsSafeAddress())

    expect(result.current('0xABCDEF')).toBe(true)
  })

  it('matches chain-specifically when a chainId is given', () => {
    jest.spyOn(useAllSafes, 'default').mockReturnValue([safeItem('1', '0xabc')])

    const { result } = renderHook(() => useGetIsSafeAddress())

    expect(result.current('0xabc', '1')).toBe(true)
    expect(result.current('0xabc', '137')).toBe(false)
  })
})
