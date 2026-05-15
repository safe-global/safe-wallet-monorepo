import { renderHook } from '@testing-library/react'
import useSecurityHubFeatureRedirect from '../useSecurityHubFeatureRedirect'
import { AppRoutes } from '@/config/routes'

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockUseHasFeature = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

describe('useSecurityHubFeatureRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to the spaces home when the SECURITY_HUB flag is explicitly off', () => {
    mockUseHasFeature.mockReturnValue(false)

    renderHook(() => useSecurityHubFeatureRedirect())

    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index })
  })

  it('does not redirect while the chain config is still loading (flag === undefined)', () => {
    mockUseHasFeature.mockReturnValue(undefined)

    renderHook(() => useSecurityHubFeatureRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when the SECURITY_HUB flag is enabled', () => {
    mockUseHasFeature.mockReturnValue(true)

    renderHook(() => useSecurityHubFeatureRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })
})
