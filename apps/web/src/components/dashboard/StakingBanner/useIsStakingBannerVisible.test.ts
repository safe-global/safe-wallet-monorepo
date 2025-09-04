import { renderHook } from '@testing-library/react'
import useIsStakingBannerVisible from './useIsStakingBannerVisible'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  __esModule: true,
  TokenType: { NATIVE_TOKEN: 'NATIVE_TOKEN', ERC20: 'ERC20' },
}))

jest.mock('@/features/stake/hooks/useIsStakingBannerEnabled', () => ({
  __esModule: true,
  default: jest.fn(),
}))
import useIsStakingBannerEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'

jest.mock('@/hooks/useBalances', () => ({
  __esModule: true,
  default: jest.fn(),
}))
import useBalances from '@/hooks/useBalances'

jest.mock('@/hooks/useSanctionedAddress', () => ({
  __esModule: true,
  useSanctionedAddress: jest.fn(),
}))
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'

// `ethers/formatUnits` is used unchanged – we just re‑export it so Jest can spy if you ever need to
jest.mock('ethers', () => {
  const real = jest.requireActual('ethers')
  return { ...real }
})

const nativeBalance = (
  etherAmount: number, // human‑readable ETH
  decimals = 18,
) => ({
  balance: (BigInt(etherAmount) * 10n ** BigInt(decimals)).toString(),
  tokenInfo: { type: 'NATIVE_TOKEN', decimals },
})

const mockIsEnabled = useIsStakingBannerEnabled as jest.MockedFunction<() => boolean>
const mockBalances = useBalances as jest.MockedFunction<any>
const mockSanctions = useSanctionedAddress as jest.MockedFunction<(f: boolean) => string | undefined>

describe('useIsStakingBannerVisible', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    // sensible happy‑path defaults for every test
    mockIsEnabled.mockReturnValue(true)
    mockSanctions.mockReturnValue(undefined)
    mockBalances.mockReturnValue({
      balances: { items: [nativeBalance(32)] }, // exactly the min
    })
  })

  it('returns TRUE when the feature is enabled, wallet is not sanctioned, and balance ≥ 32 ETH', () => {
    const { result } = renderHook(() => useIsStakingBannerVisible())
    expect(result.current).toBe(true)
  })

  it('returns FALSE when the feature‑flag is off', () => {
    mockIsEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useIsStakingBannerVisible())
    expect(result.current).toBe(false)
  })

  it('returns FALSE for a sanctioned wallet', () => {
    mockSanctions.mockReturnValue('0xDEADbeEf')

    const { result } = renderHook(() => useIsStakingBannerVisible())
    expect(result.current).toBe(false)
  })

  it('returns FALSE when the wallet has no native‑token entry at all', () => {
    mockBalances.mockReturnValue({ balances: { items: [] } })

    const { result } = renderHook(() => useIsStakingBannerVisible())
    expect(result.current).toBe(false)
  })

  it('returns FALSE when the native‑token balance is below the 32 ETH threshold', () => {
    mockBalances.mockReturnValue({
      balances: { items: [nativeBalance(31)] },
    })

    const { result } = renderHook(() => useIsStakingBannerVisible())
    expect(result.current).toBe(false)
  })
})
