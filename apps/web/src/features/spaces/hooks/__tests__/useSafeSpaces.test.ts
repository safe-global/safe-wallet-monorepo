import { renderHook, waitFor } from '@/tests/test-utils'
import {
  useSpacesGetV1Query,
  useLazySpaceSafesGetV1Query,
  type GetSpaceResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSafeSpaces } from '../useSafeSpaces'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetV1Query: jest.fn(),
  useLazySpaceSafesGetV1Query: jest.fn(),
}))

jest.mock('@/store/authSlice', () => ({
  ...jest.requireActual('@/store/authSlice'),
  isAuthenticated: jest.fn(() => true),
}))

const mockUseSpacesGetV1Query = useSpacesGetV1Query as jest.Mock
const mockUseLazySpaceSafesGetV1Query = useLazySpaceSafesGetV1Query as jest.Mock

const spaceAlpha = { uuid: 'alpha', name: 'Alpha', members: [], memberCount: 1, safeCount: 1 } as GetSpaceResponse
const spaceBravo = { uuid: 'bravo', name: 'Bravo', members: [], memberCount: 1, safeCount: 1 } as GetSpaceResponse

const safesBySpace: Record<string, { safes: Record<string, string[]> }> = {
  // Same address on two chains — should collapse to a single membership entry
  alpha: { safes: { '1': ['0xAAA'], '10': ['0xAAA'] } },
  bravo: { safes: { '1': ['0xBBB'] } },
}

describe('useSafeSpaces', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLazySpaceSafesGetV1Query.mockReturnValue([
      jest.fn((arg: { spaceId: string }) => ({ unwrap: () => Promise.resolve(safesBySpace[arg.spaceId]) })),
    ])
  })

  it('indexes each safe address to the spaces it belongs to (deduping across chains)', async () => {
    mockUseSpacesGetV1Query.mockReturnValue({ data: [spaceAlpha, spaceBravo], isLoading: false })

    const { result } = renderHook(() => useSafeSpaces())

    await waitFor(() => expect(Object.keys(result.current.safeSpaces)).toHaveLength(2))
    expect(result.current.safeSpaces['0xaaa']).toEqual([spaceAlpha])
    expect(result.current.safeSpaces['0xbbb']).toEqual([spaceBravo])
  })

  it('returns an empty map when the user has no spaces (e.g. signed out)', async () => {
    mockUseSpacesGetV1Query.mockReturnValue({ data: [], isLoading: false })

    const { result } = renderHook(() => useSafeSpaces())

    await waitFor(() => expect(result.current.safeSpaces).toEqual({}))
  })
})
