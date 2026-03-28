import { renderHook } from '@/tests/test-utils'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'

// Mainnet has a SAFE token address; Polygon does not
const MAINNET_CHAIN_ID = '1'
const UNSUPPORTED_CHAIN_ID = '137'

let mockIsBlockedCountry: boolean | null = false
let mockSafeLoaded = true
let mockChainId = MAINNET_CHAIN_ID

jest.mock('@/components/common/GeoblockingProvider', () => ({
  GeoblockingContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    _currentValue: null,
  },
}))

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: (context: unknown) => {
    const { GeoblockingContext } = require('@/components/common/GeoblockingProvider')
    if (context === GeoblockingContext) return mockIsBlockedCountry
    return jest.requireActual('react').useContext(context)
  },
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: mockChainId }, safeLoaded: mockSafeLoaded }),
}))

describe('useSafeTokenEnabled', () => {
  beforeEach(() => {
    mockIsBlockedCountry = false
    mockSafeLoaded = true
    mockChainId = MAINNET_CHAIN_ID
  })

  it('returns true when safe is loaded on a supported chain and not geo-blocked', () => {
    const { result } = renderHook(() => useSafeTokenEnabled())
    expect(result.current).toBe(true)
  })

  it('returns false when the chain has no SAFE token address', () => {
    mockChainId = UNSUPPORTED_CHAIN_ID
    const { result } = renderHook(() => useSafeTokenEnabled())
    expect(result.current).toBe(false)
  })

  it('returns false when the user is geo-blocked', () => {
    mockIsBlockedCountry = true
    const { result } = renderHook(() => useSafeTokenEnabled())
    expect(result.current).toBe(false)
  })

  it('returns false when the safe is not yet loaded', () => {
    mockSafeLoaded = false
    const { result } = renderHook(() => useSafeTokenEnabled())
    expect(result.current).toBe(false)
  })
})
