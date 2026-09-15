import { renderHook } from '@/tests/test-utils'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUpsertWorkspaceSafeName } from '../useUpsertWorkspaceSafeName'
import { useCurrentSpaceId } from '../useCurrentSpaceId'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksUpsertAddressBookItemsV1Mutation: jest.fn(),
}))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))
jest.mock('../useWorkspaceAddressBookLabel', () => ({ useWorkspaceAddressBookLabel: () => 'Acme address book' }))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1' }, { chainId: '137' }] }),
}))

const ADDRESS = '0x1111111111111111111111111111111111111111'
const SPACE_ID = 'space-uuid'

const setup = ({ result = {} }: { result?: unknown } = {}) => {
  const upsert = jest.fn().mockResolvedValue(result)
  ;(useAddressBooksUpsertAddressBookItemsV1Mutation as jest.Mock).mockReturnValue([upsert])
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue(SPACE_ID)
  return upsert
}

describe('useUpsertWorkspaceSafeName', () => {
  beforeEach(() => jest.clearAllMocks())

  it('writes the name to the current space address book on every supported chain', async () => {
    const upsert = setup()
    const { result } = renderHook(() => useUpsertWorkspaceSafeName())

    await expect(result.current({ address: ADDRESS, name: 'Treasury' })).resolves.toEqual({})

    expect(upsert).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      upsertAddressBookItemsDto: { items: [{ name: 'Treasury', address: ADDRESS, chainIds: ['1', '137'] }] },
    })
  })

  it('returns an error message when the request fails', async () => {
    setup({ result: { error: { status: 403, data: { message: 'Forbidden' } } } })
    const { result } = renderHook(() => useUpsertWorkspaceSafeName())

    await expect(result.current({ address: ADDRESS, name: 'Treasury' })).resolves.toEqual({
      error: 'Forbidden',
    })
  })

  it('does not call the API without a space', async () => {
    const upsert = setup()
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue(null)
    const { result } = renderHook(() => useUpsertWorkspaceSafeName())

    await expect(result.current({ address: ADDRESS, name: 'Treasury' })).resolves.toEqual({
      error: 'No workspace is selected. Switch to a workspace and try again.',
    })
    expect(upsert).not.toHaveBeenCalled()
  })
})
