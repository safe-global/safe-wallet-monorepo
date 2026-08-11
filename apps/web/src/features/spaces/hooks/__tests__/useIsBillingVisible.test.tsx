import { renderHook } from '@testing-library/react'
import useIsBillingVisible from '../useIsBillingVisible'
import { FEATURES } from '@safe-global/utils/utils/chains'

const mockUseChains = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => mockUseChains(),
}))

const chain = (features: string[]) => ({ features })
const result = () => renderHook(() => useIsBillingVisible()).result.current

describe('useIsBillingVisible', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is true when GTF_PLANS is enabled on some configured chain', () => {
    mockUseChains.mockReturnValue({ configs: [chain([]), chain([FEATURES.GTF_PLANS])], loading: false })
    expect(result()).toBe(true)
  })

  it('is true when GTF is enabled on some configured chain', () => {
    mockUseChains.mockReturnValue({ configs: [chain([FEATURES.GTF])], loading: false })
    expect(result()).toBe(true)
  })

  it('is false when no configured chain has either flag', () => {
    mockUseChains.mockReturnValue({ configs: [chain([FEATURES.SECURITY_HUB]), chain([])], loading: false })
    expect(result()).toBe(false)
  })

  it('is undefined while the chain config is loading', () => {
    mockUseChains.mockReturnValue({ configs: [], loading: true })
    expect(result()).toBeUndefined()
  })

  it('is undefined when no chains have loaded yet (avoids flicker)', () => {
    mockUseChains.mockReturnValue({ configs: [], loading: false })
    expect(result()).toBeUndefined()
  })
})
