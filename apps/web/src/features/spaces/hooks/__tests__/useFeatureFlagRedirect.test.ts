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

describe('useFeatureFlagRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to /welcome/accounts when SPACES is off', () => {
    mockUseHasFeature.mockReturnValue(false)

    renderHook(() => useFeatureFlagRedirect())

    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.accounts })
  })

  it('does not redirect when SPACES is enabled', () => {
    mockUseHasFeature.mockReturnValue(true)

    renderHook(() => useFeatureFlagRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })
})
