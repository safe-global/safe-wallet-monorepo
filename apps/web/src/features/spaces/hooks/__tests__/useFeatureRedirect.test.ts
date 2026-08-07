import { renderHook } from '@testing-library/react'
import useFeatureRedirect from '../useFeatureRedirect'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'

const mockPush = jest.fn()
let mockQuery: Record<string, string | string[]> = {}
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, query: mockQuery }),
}))

const mockUseHasFeature = jest.fn<boolean | undefined, []>()
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

describe('useFeatureRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = {}
  })

  it('redirects when the feature is explicitly off, preserving the spaceId', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockQuery = { spaceId: 'space-uuid-1' }

    renderHook(() => useFeatureRedirect(FEATURES.SPACE_AUDIT_LOG, AppRoutes.spaces.index))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.index,
      query: { spaceId: 'space-uuid-1' },
    })
  })

  it('redirects without a query when there is no spaceId', () => {
    mockUseHasFeature.mockReturnValue(false)

    renderHook(() => useFeatureRedirect(FEATURES.SPACE_AUDIT_LOG, AppRoutes.spaces.index))

    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index, query: undefined })
  })

  it('does not redirect while the chain config is still loading', () => {
    mockUseHasFeature.mockReturnValue(undefined)

    renderHook(() => useFeatureRedirect(FEATURES.SPACE_AUDIT_LOG, AppRoutes.spaces.index))

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when the feature is enabled', () => {
    mockUseHasFeature.mockReturnValue(true)

    renderHook(() => useFeatureRedirect(FEATURES.SPACE_AUDIT_LOG, AppRoutes.spaces.index))

    expect(mockPush).not.toHaveBeenCalled()
  })
})
