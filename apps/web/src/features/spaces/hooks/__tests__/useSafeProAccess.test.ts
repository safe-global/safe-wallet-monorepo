import { renderHook } from '@testing-library/react'
import { useSafeProAccess } from '../useSafeProAccess'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const SAFE = '0x1234567890123456789012345678901234567890'

const mockUseHasFeature = jest.fn()
const mockIsSignedIn = jest.fn()
const mockUseSpaceSafesGetV1Query = jest.fn()
const mockUseSpacePlan = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('@/store', () => ({ useAppSelector: () => mockIsSignedIn() }))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
jest.mock('@/hooks/useSafeAddress', () => ({ __esModule: true, default: () => SAFE }))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => SPACE_ID }))
jest.mock('../useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
}))

describe('useSafeProAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockIsSignedIn.mockReturnValue(true)
    mockUseSpaceSafesGetV1Query.mockReturnValue({
      currentData: { safes: { '1': [SAFE.toLowerCase()] } },
      isLoading: false,
    })
    mockUseSpacePlan.mockReturnValue({ status: 'trialing', isLoading: false })
  })

  it('grants the Pro features to a Safe in a Workspace with a live subscription', () => {
    expect(renderHook(() => useSafeProAccess()).result.current).toEqual({
      hasProFeatures: true,
      isSafePro: true,
      isLoading: false,
      spaceId: SPACE_ID,
    })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(
      { spaceId: SPACE_ID },
      expect.objectContaining({ skip: false }),
    )
  })

  it.each([
    [
      'the Workspace has no live subscription',
      () => mockUseSpacePlan.mockReturnValue({ status: 'none', isLoading: false }),
    ],
    ['the subscription lapsed', () => mockUseSpacePlan.mockReturnValue({ status: 'canceled', isLoading: false })],
    [
      'the Safe is not part of the Workspace',
      () =>
        mockUseSpaceSafesGetV1Query.mockReturnValue({
          currentData: { safes: { '1': ['0x00000000000000000000000000000000000000aa'] } },
          isLoading: false,
        }),
    ],
    ['the user is signed out', () => mockIsSignedIn.mockReturnValue(false)],
  ])('withholds them when %s', (_, arrange) => {
    arrange()
    if (!mockIsSignedIn()) mockUseSpaceSafesGetV1Query.mockReturnValue({ currentData: undefined, isLoading: false })

    expect(renderHook(() => useSafeProAccess()).result.current.hasProFeatures).toBe(false)
  })

  it('names no Workspace to upgrade when the current one does not hold the Safe', () => {
    mockUseSpaceSafesGetV1Query.mockReturnValue({
      currentData: { safes: { '1': ['0x00000000000000000000000000000000000000aa'] } },
      isLoading: false,
    })

    expect(renderHook(() => useSafeProAccess()).result.current.spaceId).toBeNull()
  })

  it('reports loading while the Workspace safes or the plan are still resolving', () => {
    mockUseSpacePlan.mockReturnValue({ status: 'none', isLoading: true })

    expect(renderHook(() => useSafeProAccess()).result.current).toEqual({
      hasProFeatures: false,
      isSafePro: true,
      isLoading: true,
      spaceId: SPACE_ID,
    })
  })

  it('keeps everything open while SAFE_PRO is off, without asking for the Workspace safes', () => {
    mockUseHasFeature.mockReturnValue(false)

    expect(renderHook(() => useSafeProAccess()).result.current).toEqual({
      hasProFeatures: true,
      isSafePro: false,
      isLoading: false,
      spaceId: null,
    })
    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })
})
