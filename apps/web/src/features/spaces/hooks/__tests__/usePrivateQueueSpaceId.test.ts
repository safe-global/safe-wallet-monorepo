import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePrivateQueueSpaceId } from '../usePrivateQueueSpaceId'

const mockUseHasFeature = jest.fn()
const mockUseSafeProAccess = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: (feature: FEATURES) => mockUseHasFeature(feature) }))
jest.mock('../useSafeProAccess', () => ({ useSafeProAccess: () => mockUseSafeProAccess() }))

describe('usePrivateQueueSpaceId', () => {
  it('should, when PRIVATE_QUEUE is on and the Safe is in a Safe Pro Workspace, return the Workspace ID', () => {
    const spaceId = faker.string.uuid()
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeProAccess.mockReturnValue({ hasProFeatures: true, isSafePro: true, isLoading: false, spaceId })

    const { result } = renderHook(() => usePrivateQueueSpaceId())

    expect(result.current).toBe(spaceId)
    expect(mockUseHasFeature).toHaveBeenCalledWith(FEATURES.PRIVATE_QUEUE)
  })

  it('should, when PRIVATE_QUEUE is off, return undefined', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseSafeProAccess.mockReturnValue({
      hasProFeatures: true,
      isSafePro: true,
      isLoading: false,
      spaceId: faker.string.uuid(),
    })

    const { result } = renderHook(() => usePrivateQueueSpaceId())

    expect(result.current).toBeUndefined()
  })

  it('should, when the Workspace has no live Safe Pro plan, return undefined', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeProAccess.mockReturnValue({
      hasProFeatures: false,
      isSafePro: true,
      isLoading: false,
      spaceId: faker.string.uuid(),
    })

    const { result } = renderHook(() => usePrivateQueueSpaceId())

    expect(result.current).toBeUndefined()
  })

  it('should, when SAFE_PRO is off, return undefined', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockUseSafeProAccess.mockReturnValue({ hasProFeatures: true, isSafePro: false, isLoading: false, spaceId: null })

    const { result } = renderHook(() => usePrivateQueueSpaceId())

    expect(result.current).toBeUndefined()
  })
})
