import { renderHook, waitFor } from '@/tests/test-utils'
import {
  useSpacesGetV1Query,
  useLazySpaceSafesGetV1Query,
  type GetSpaceResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useSafeSpaces } from '@/hooks/useSafeSpaces'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetV1Query: jest.fn(),
  useLazySpaceSafesGetV1Query: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: jest.fn(),
}))

jest.mock('@/store/authSlice', () => ({
  ...jest.requireActual('@/store/authSlice'),
  isAuthenticated: jest.fn(() => true),
}))

const mockUseSpacesGetV1Query = useSpacesGetV1Query as jest.Mock
const mockUseLazySpaceSafesGetV1Query = useLazySpaceSafesGetV1Query as jest.Mock
const mockUseUsersGetWithWalletsV1Query = useUsersGetWithWalletsV1Query as jest.Mock

const CURRENT_USER_ID = 1
const OTHER_USER_ID = 2

type Status = 'ACTIVE' | 'INVITED'
const member = (status: Status, userId = CURRENT_USER_ID) =>
  ({ status, user: { id: userId } }) as GetSpaceResponse['members'][number]
const space = (uuid: string, members = [member('ACTIVE')]) =>
  ({ uuid, name: uuid, members, memberCount: members.length, safeCount: 1 }) as GetSpaceResponse
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
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ data: { id: CURRENT_USER_ID }, isLoading: false })
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

  it('skips Spaces the current user is only invited to, even when other members are active', async () => {
    const trigger = mockSafesResolver({ alpha: { safes: { '1': ['0xAAA'] } } })
    const invited = space('invited', [member('ACTIVE', OTHER_USER_ID), member('INVITED')])
    mockUseSpacesGetV1Query.mockReturnValue({ data: [spaceAlpha, invited], isLoading: false })

    const { result } = renderHook(() => useSafeSpaces())

    await waitFor(() => expect(result.current.safeSpaces['1:0xaaa']).toEqual([spaceAlpha]))
    expect(trigger).toHaveBeenCalledTimes(1)
    expect(trigger).toHaveBeenCalledWith({ spaceId: 'alpha' }, true)
  })

  it('waits for the current user before looking up any Space', async () => {
    const trigger = mockSafesResolver({ alpha: { safes: { '1': ['0xAAA'] } } })
    mockUseSpacesGetV1Query.mockReturnValue({ data: [spaceAlpha], isLoading: false })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ data: undefined, isLoading: true })

    const { result } = renderHook(() => useSafeSpaces())

    expect(result.current.isLoading).toBe(true)
    expect(trigger).not.toHaveBeenCalled()
  })

  it('does not fetch any Space safes while skipped', async () => {
    mockSafesResolver({})
    mockUseSpacesGetV1Query.mockReturnValue({ data: undefined, isLoading: false })

    const { result } = renderHook(() => useSafeSpaces(true))

    expect(mockUseSpacesGetV1Query).toHaveBeenCalledWith(undefined, { skip: true })
    expect(mockUseUsersGetWithWalletsV1Query).toHaveBeenCalledWith(undefined, { skip: true })
    await waitFor(() => expect(result.current).toEqual({ safeSpaces: {}, isLoading: false }))
  })
})
