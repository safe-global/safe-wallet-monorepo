import { renderHook } from '@/tests/test-utils'
import useMatchSafe from '../useMatchSafe'
import * as useChains from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeItem } from '@/hooks/safes'

const mockChains = [
  { chainId: '1', chainName: 'Ethereum', shortName: 'eth' },
  { chainId: '11155111', chainName: 'Sepolia', shortName: 'sep' },
  { chainId: '137', chainName: 'Polygon', shortName: 'matic' },
] as Chain[]

describe('useMatchSafe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'default').mockReturnValue({ configs: mockChains })
  })

  const makeSafe = (overrides: Partial<SafeItem> = {}): SafeItem => ({
    chainId: '1',
    address: '0xAbC123def456',
    isReadOnly: false,
    isPinned: false,
    lastVisited: 0,
    name: undefined,
    ...overrides,
  })

  it('matches by address', () => {
    const { result } = renderHook(() => useMatchSafe())
    const safe = makeSafe()

    expect(result.current(safe, 'abc123')).toBe(true)
    expect(result.current(safe, 'zzz')).toBe(false)
  })

  it('matches by safe name', () => {
    const { result } = renderHook(() => useMatchSafe())
    const safe = makeSafe({ name: 'My Treasury' })

    expect(result.current(safe, 'treasury')).toBe(true)
    expect(result.current(safe, 'vault')).toBe(false)
  })

  it('matches by address book name when safe has no name', () => {
    const { result } = renderHook(() => useMatchSafe(), {
      initialReduxState: {
        addressBook: {
          '1': { '0xAbC123def456': 'Team Wallet' },
        },
      },
    })
    const safe = makeSafe()

    expect(result.current(safe, 'team')).toBe(true)
  })

  it('matches by chain name', () => {
    const { result } = renderHook(() => useMatchSafe())
    const safe = makeSafe({ chainId: '11155111' })

    expect(result.current(safe, 'sepolia')).toBe(true)
    expect(result.current(safe, 'sep')).toBe(true)
  })

  it('matches by short name', () => {
    const { result } = renderHook(() => useMatchSafe())
    const ethSafe = makeSafe({ chainId: '1' })
    const maticSafe = makeSafe({ chainId: '137' })

    expect(result.current(ethSafe, 'eth')).toBe(true)
    expect(result.current(maticSafe, 'matic')).toBe(true)
    expect(result.current(maticSafe, 'polygon')).toBe(true)
  })

  it('does not match unrelated chain queries', () => {
    const { result } = renderHook(() => useMatchSafe())
    const ethSafe = makeSafe({ chainId: '1' })

    expect(result.current(ethSafe, 'sepolia')).toBe(false)
    expect(result.current(ethSafe, 'matic')).toBe(false)
  })
})
