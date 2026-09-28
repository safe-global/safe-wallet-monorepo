import { renderHook, waitFor } from '@/tests/test-utils'
import {
  useSpacesGetV1Query,
  useLazySpaceSafesGetV1Query,
  type GetSpaceResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { _mapWithConcurrency, useSafeSpaces } from '../useSafeSpaces'

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

const member = (status: 'ACTIVE' | 'INVITED') => ({ status }) as GetSpaceResponse['members'][number]
const space = (uuid: string, status: 'ACTIVE' | 'INVITED' = 'ACTIVE') =>
  ({ uuid, name: uuid, members: [member(status)], memberCount: 1, safeCount: 1 }) as GetSpaceResponse
const spaceAlpha = space('alpha')
const spaceBravo = space('bravo')

const mockSafesResolver = (safesBySpace: Record<string, { safes: Record<string, string[]> }>) => {
  const trigger = jest.fn((arg: { spaceId: string }) => ({ unwrap: () => Promise.resolve(safesBySpace[arg.spaceId]) }))
  mockUseLazySpaceSafesGetV1Query.mockReturnValue([trigger])
  return trigger
}

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

  it('skips Spaces the user is only invited to, whose Safes they cannot read yet', async () => {
    const trigger = mockSafesResolver({ alpha: { safes: { '1': ['0xAAA'] } } })
    mockUseSpacesGetV1Query.mockReturnValue({ data: [spaceAlpha, space('invited', 'INVITED')], isLoading: false })

    const { result } = renderHook(() => useSafeSpaces())

    await waitFor(() => expect(result.current.safeSpaces['1:0xaaa']).toEqual([spaceAlpha]))
    expect(trigger).toHaveBeenCalledTimes(1)
    expect(trigger).toHaveBeenCalledWith({ spaceId: 'alpha' }, true)
  })

  it('does not fetch any Space safes while skipped', async () => {
    mockSafesResolver({})
    mockUseSpacesGetV1Query.mockReturnValue({ data: undefined, isLoading: false })

    const { result } = renderHook(() => useSafeSpaces(true))

    expect(mockUseSpacesGetV1Query).toHaveBeenCalledWith(undefined, { skip: true })
    await waitFor(() => expect(result.current).toEqual({ safeSpaces: {}, isLoading: false }))
  })
})

describe('_mapWithConcurrency', () => {
  it('never runs more than the limit at once and keeps the input order', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const results = await _mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, async (n) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 10 - n))
      inFlight--
      return n * 2
    })

    expect(maxInFlight).toBe(4)
    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
  })

  it('resolves to an empty list for no items', async () => {
    await expect(_mapWithConcurrency([], 4, async (n) => n)).resolves.toEqual([])
  })
})
