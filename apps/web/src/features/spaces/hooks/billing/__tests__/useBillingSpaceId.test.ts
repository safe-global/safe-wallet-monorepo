import { renderHook } from '@testing-library/react'
import { useBillingSpaceId } from '../useBillingSpaceId'

const mockIsSignedIn = jest.fn<boolean, []>()
const mockHasSafePro = jest.fn<boolean | undefined, []>()
const mockCurrentSpaceId = jest.fn<string | null, []>()
jest.mock('@/store', () => ({ useAppSelector: () => mockIsSignedIn() }))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockHasSafePro() }))
jest.mock('../../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockCurrentSpaceId() }))

const CURRENT_SPACE_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_SPACE_ID = '22222222-2222-2222-2222-222222222222'

describe('useBillingSpaceId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSignedIn.mockReturnValue(true)
    mockHasSafePro.mockReturnValue(true)
    mockCurrentSpaceId.mockReturnValue(CURRENT_SPACE_ID)
  })

  it('falls back to the current space only when no space is passed', () => {
    expect(renderHook(() => useBillingSpaceId()).result.current).toBe(CURRENT_SPACE_ID)
    expect(renderHook(() => useBillingSpaceId(OTHER_SPACE_ID)).result.current).toBe(OTHER_SPACE_ID)
    expect(renderHook(() => useBillingSpaceId(null)).result.current).toBeNull()
  })

  it.each([
    ['Safe Pro is off', () => mockHasSafePro.mockReturnValue(false)],
    ['the Safe Pro flag is still loading', () => mockHasSafePro.mockReturnValue(undefined)],
    ['the user is signed out', () => mockIsSignedIn.mockReturnValue(false)],
    ['there is no current space', () => mockCurrentSpaceId.mockReturnValue(null)],
  ])('is null while %s', (_, arrange) => {
    arrange()
    expect(renderHook(() => useBillingSpaceId()).result.current).toBeNull()
  })
})
