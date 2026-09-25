import { renderHook } from '@testing-library/react'
import { useBillingSpaceId } from '../useBillingSpaceId'

const mockUseIsSafeProEnabled = jest.fn<boolean | undefined, []>()
let mockIsSignedIn = true
let mockCurrentSpaceId: string | null = null

jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockUseIsSafeProEnabled() }))
jest.mock('@/store', () => ({ useAppSelector: () => mockIsSignedIn }))
jest.mock('../../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockCurrentSpaceId }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const CURRENT_SPACE_ID = '22222222-2222-2222-2222-222222222222'

describe('useBillingSpaceId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSafeProEnabled.mockReturnValue(true)
    mockIsSignedIn = true
    mockCurrentSpaceId = CURRENT_SPACE_ID
  })

  it('returns the explicit spaceId when Safe Pro is live and the user is signed in', () => {
    const { result } = renderHook(() => useBillingSpaceId(SPACE_ID))

    expect(result.current).toBe(SPACE_ID)
  })

  it('falls back to the current space when spaceId is undefined', () => {
    const { result } = renderHook(() => useBillingSpaceId())

    expect(result.current).toBe(CURRENT_SPACE_ID)
  })

  it('returns null when spaceId is null', () => {
    const { result } = renderHook(() => useBillingSpaceId(null))

    expect(result.current).toBeNull()
  })

  it.each([
    ['off', false],
    ['loading', undefined],
  ])('returns null when the Safe Pro flag is %s', (_, value) => {
    mockUseIsSafeProEnabled.mockReturnValue(value)
    const { result } = renderHook(() => useBillingSpaceId(SPACE_ID))

    expect(result.current).toBeNull()
  })

  it('returns null when signed out', () => {
    mockIsSignedIn = false
    const { result } = renderHook(() => useBillingSpaceId(SPACE_ID))

    expect(result.current).toBeNull()
  })

  it('returns null when there is no space', () => {
    mockCurrentSpaceId = null
    const { result } = renderHook(() => useBillingSpaceId())

    expect(result.current).toBeNull()
  })
})
