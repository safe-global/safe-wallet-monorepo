import { renderHook } from '@testing-library/react'
import useFeatureFlagRedirect from '../useFeatureFlagRedirect'
import { AppRoutes } from '@/config/routes'

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockUseHasFeature = jest.fn<boolean | undefined, []>()
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

const mockUseIsRequireLoginEnabled = jest.fn<boolean | undefined, []>()
jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: () => mockUseIsRequireLoginEnabled(),
}))

describe('useFeatureFlagRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to /welcome/accounts when SPACES is off and the gate is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseIsRequireLoginEnabled.mockReturnValue(false)

    renderHook(() => useFeatureFlagRedirect())

    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.accounts })
  })

  it('does not redirect while the require-login flag is still loading', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseIsRequireLoginEnabled.mockReturnValue(undefined)

    renderHook(() => useFeatureFlagRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when the gate is on (avoids ping-pong with the route guard)', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseIsRequireLoginEnabled.mockReturnValue(true)

    renderHook(() => useFeatureFlagRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when SPACES is enabled', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseIsRequireLoginEnabled.mockReturnValue(false)

    renderHook(() => useFeatureFlagRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })
})
