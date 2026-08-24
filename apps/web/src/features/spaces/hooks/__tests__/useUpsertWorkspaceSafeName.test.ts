import { renderHook } from '@/tests/test-utils'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUpsertWorkspaceSafeName } from '../useUpsertWorkspaceSafeName'
import { useCurrentSpaceId } from '../useCurrentSpaceId'
import useGetSpaceAddressBook from '../useGetSpaceAddressBook'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksUpsertAddressBookItemsV1Mutation: jest.fn(),
}))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))
jest.mock('../useGetSpaceAddressBook', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../useWorkspaceAddressBookLabel', () => ({ useWorkspaceAddressBookLabel: () => 'Acme address book' }))

const ADDRESS = '0x1111111111111111111111111111111111111111'
const SPACE_ID = 'space-uuid'

const setup = ({ addressBook = [], result = {} }: { addressBook?: unknown[]; result?: unknown } = {}) => {
  const upsert = jest.fn().mockResolvedValue(result)
  ;(useAddressBooksUpsertAddressBookItemsV1Mutation as jest.Mock).mockReturnValue([upsert])
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue(SPACE_ID)
  ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue(addressBook)
  return upsert
}

describe('useUpsertWorkspaceSafeName', () => {
  beforeEach(() => jest.clearAllMocks())

  it('writes the name to the current space address book', async () => {
    const upsert = setup()
    const { result } = renderHook(() => useUpsertWorkspaceSafeName())

    await expect(result.current({ address: ADDRESS, name: 'Treasury', chainIds: ['1'] })).resolves.toEqual({})

    expect(upsert).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      upsertAddressBookItemsDto: { items: [{ name: 'Treasury', address: ADDRESS, chainIds: ['1'] }] },
    })
  })

  it('merges the existing entry chainIds instead of replacing them', async () => {
    const upsert = setup({ addressBook: [{ address: ADDRESS, name: 'Old', chainIds: ['1', '137'] }] })
    const { result } = renderHook(() => useUpsertWorkspaceSafeName())

    await result.current({ address: ADDRESS, name: 'New', chainIds: ['10'] })

    const sent = upsert.mock.calls[0][0].upsertAddressBookItemsDto.items[0]
    expect(sent.chainIds.sort()).toEqual(['1', '10', '137'])
  })

  it('returns an error message when the request fails', async () => {
    setup({ result: { error: { status: 403, data: { message: 'Forbidden' } } } })
    const { result } = renderHook(() => useUpsertWorkspaceSafeName())

    await expect(result.current({ address: ADDRESS, name: 'Treasury', chainIds: ['1'] })).resolves.toEqual({
      error: 'Forbidden',
    })
  })

  it('does not call the API without a space', async () => {
    const upsert = setup()
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue(null)
    const { result } = renderHook(() => useUpsertWorkspaceSafeName())

    await expect(result.current({ address: ADDRESS, name: 'Treasury', chainIds: ['1'] })).resolves.toEqual({
      error: 'No workspace selected.',
    })
    expect(upsert).not.toHaveBeenCalled()
  })
})
