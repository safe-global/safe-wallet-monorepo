import { renderHook } from '@testing-library/react'
import useBillingFeatureRedirect from '../useBillingFeatureRedirect'
import { AppRoutes } from '@/config/routes'

const mockPush = jest.fn()
let mockQuery: Record<string, string> = {}
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, query: mockQuery }),
}))

const mockUseIsBillingVisible = jest.fn<boolean | undefined, []>()
jest.mock('../useIsBillingVisible', () => ({
  __esModule: true,
  default: () => mockUseIsBillingVisible(),
}))

describe('useBillingFeatureRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = { spaceId: '42' }
  })

  it('redirects to the spaces index (keeping spaceId) when billing is not visible', () => {
    mockUseIsBillingVisible.mockReturnValue(false)

    renderHook(() => useBillingFeatureRedirect())

    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index, query: { spaceId: '42' } })
  })

  it('does not redirect while visibility is still loading', () => {
    mockUseIsBillingVisible.mockReturnValue(undefined)

    renderHook(() => useBillingFeatureRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when billing is visible', () => {
    mockUseIsBillingVisible.mockReturnValue(true)

    renderHook(() => useBillingFeatureRedirect())

    expect(mockPush).not.toHaveBeenCalled()
  })
})
