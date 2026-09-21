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

const mockSafesResolver = (safesBySpace: Record<string, { safes: Record<string, string[]> }>) =>
  mockUseLazySpaceSafesGetV1Query.mockReturnValue([
    jest.fn((arg: { spaceId: string }) => ({ unwrap: () => Promise.resolve(safesBySpace[arg.spaceId]) })),
  ])

describe('useSafeSpaces', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('indexes each safe by a chain-qualified key to the spaces it belongs to', async () => {
    mockSafesResolver({
      // Same address on two chains — indexed as two distinct chain-qualified keys.
      alpha: { safes: { '1': ['0xAAA'], '10': ['0xAAA'] } },
      bravo: { safes: { '1': ['0xBBB'] } },
    })
    mockUseSpacesGetV1Query.mockReturnValue({ data: [spaceAlpha, spaceBravo], isLoading: false })

    const { result } = renderHook(() => useSafeSpaces())

    await waitFor(() => expect(Object.keys(result.current.safeSpaces)).toHaveLength(3))
    expect(result.current.safeSpaces['1:0xaaa']).toEqual([spaceAlpha])
    expect(result.current.safeSpaces['10:0xaaa']).toEqual([spaceAlpha])
    expect(result.current.safeSpaces['1:0xbbb']).toEqual([spaceBravo])
  })

  it('does not leak a same-address membership across chains between spaces', async () => {
    mockSafesResolver({
      // The same address lives in different spaces on different chains — each chain keeps its own space.
      alpha: { safes: { '1': ['0xAAA'] } },
      bravo: { safes: { '10': ['0xAAA'] } },
    })
    mockUseSpacesGetV1Query.mockReturnValue({ data: [spaceAlpha, spaceBravo], isLoading: false })

    const { result } = renderHook(() => useSafeSpaces())

    await waitFor(() => expect(Object.keys(result.current.safeSpaces)).toHaveLength(2))
    expect(result.current.safeSpaces['1:0xaaa']).toEqual([spaceAlpha])
    expect(result.current.safeSpaces['10:0xaaa']).toEqual([spaceBravo])
  })

  it('returns an empty map when the user has no spaces (e.g. signed out)', async () => {
    mockSafesResolver({})
    mockUseSpacesGetV1Query.mockReturnValue({ data: [], isLoading: false })

    const { result } = renderHook(() => useSafeSpaces())

    await waitFor(() => expect(result.current.safeSpaces).toEqual({}))
  })
})
