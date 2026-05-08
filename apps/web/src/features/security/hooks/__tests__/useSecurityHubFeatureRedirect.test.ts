import { renderHook, act } from '@testing-library/react'
import useSecurityHubFeatureRedirect from '../useSecurityHubFeatureRedirect'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockUseChains = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => mockUseChains(),
}))

const mockUseGetChainsConfigV2Query = jest.fn()
jest.mock('@safe-global/store/gateway', () => ({
  useGetChainsConfigV2Query: () => mockUseGetChainsConfigV2Query(),
}))

const chainWithSecurityHub = chainBuilder()
  .with({ features: [FEATURES.SECURITY_HUB] })
  .build()
const chainWithoutSecurityHub = chainBuilder()
  .with({ features: [FEATURES.SAFE_APPS] })
  .build()

const setQueryState = (isFetching: boolean) => mockUseGetChainsConfigV2Query.mockReturnValue({ isFetching })
const setConfigs = (configs: Array<typeof chainWithSecurityHub>) => mockUseChains.mockReturnValue({ configs })

describe('useSecurityHubFeatureRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not redirect on the static seed alone (no fetch transition observed)', () => {
    setConfigs([chainWithoutSecurityHub])
    setQueryState(false)

    renderHook(() => useSecurityHubFeatureRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect while a refetch is in flight', () => {
    setConfigs([chainWithoutSecurityHub])
    setQueryState(true)

    renderHook(() => useSecurityHubFeatureRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects after live data confirms SECURITY_HUB is disabled on every chain', () => {
    setConfigs([chainWithoutSecurityHub, chainWithoutSecurityHub])
    setQueryState(true)
    const { rerender } = renderHook(() => useSecurityHubFeatureRedirect())

    setQueryState(false)
    act(() => rerender())

    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index })
  })

  it('does not redirect after live data confirms SECURITY_HUB is enabled on at least one chain', () => {
    setConfigs([chainWithoutSecurityHub, chainWithSecurityHub])
    setQueryState(true)
    const { rerender } = renderHook(() => useSecurityHubFeatureRedirect())

    setQueryState(false)
    act(() => rerender())

    expect(mockPush).not.toHaveBeenCalled()
  })
})
