import { renderHook } from '@/tests/test-utils'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUpsertWorkspaceSafeName, useUpsertWorkspaceSafeNames } from '../useUpsertWorkspaceSafeName'
import { useCurrentSpaceId } from '../useCurrentSpaceId'
import { useSpaceAddressBookState } from '../useGetSpaceAddressBook'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksUpsertAddressBookItemsV1Mutation: jest.fn(),
}))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))
jest.mock('../useGetSpaceAddressBook', () => ({ __esModule: true, useSpaceAddressBookState: jest.fn() }))
jest.mock('../useWorkspaceAddressBookLabel', () => ({ useWorkspaceAddressBookLabel: () => 'Acme address book' }))

const ADDRESS = '0x1111111111111111111111111111111111111111'
const SPACE_ID = 'space-uuid'

const setup = ({
  addressBook = [],
  result = {},
  isLoading = false,
  isError = false,
}: { addressBook?: unknown[]; result?: unknown; isLoading?: boolean; isError?: boolean } = {}) => {
  const upsert = jest.fn().mockResolvedValue(result)
  ;(useAddressBooksUpsertAddressBookItemsV1Mutation as jest.Mock).mockReturnValue([upsert])
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue(SPACE_ID)
  ;(useSpaceAddressBookState as jest.Mock).mockReturnValue({ items: addressBook, isLoading, isError })
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
      error: 'No Workspace is selected. Switch to a Workspace and try again.',
    })
    expect(upsert).not.toHaveBeenCalled()
  })
})

describe('useUpsertWorkspaceSafeNames', () => {
  const OTHER_ADDRESS = '0x2222222222222222222222222222222222222222'

  beforeEach(() => jest.clearAllMocks())

  it('writes every name in a single request and merges each entry chainIds', async () => {
    const upsert = setup({ addressBook: [{ address: ADDRESS, name: 'Old', chainIds: ['137'] }] })
    const { result } = renderHook(() => useUpsertWorkspaceSafeNames())

    await expect(
      result.current([
        { address: ADDRESS, name: ' Treasury ', chainIds: ['1'] },
        { address: OTHER_ADDRESS, name: 'Ops', chainIds: ['1', '10'] },
      ]),
    ).resolves.toEqual({})

    expect(upsert).toHaveBeenCalledTimes(1)
    const { items } = upsert.mock.calls[0][0].upsertAddressBookItemsDto
    expect(items[0]).toEqual({ name: 'Treasury', address: ADDRESS, chainIds: ['137', '1'] })
    expect(items[1]).toEqual({ name: 'Ops', address: OTHER_ADDRESS, chainIds: ['1', '10'] })
  })

  it('does not call the API for an empty list', async () => {
    const upsert = setup()
    const { result } = renderHook(() => useUpsertWorkspaceSafeNames())

    await expect(result.current([])).resolves.toEqual({})
    expect(upsert).not.toHaveBeenCalled()
  })

  it('returns the error message when the request fails', async () => {
    setup({ result: { error: { status: 403, data: { message: 'Forbidden' } } } })
    const { result } = renderHook(() => useUpsertWorkspaceSafeNames())

    await expect(result.current([{ address: ADDRESS, name: 'Treasury', chainIds: ['1'] }])).resolves.toEqual({
      error: 'Forbidden',
    })
  })
})

describe('useUpsertWorkspaceSafeNames — address book not read', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([
    ['still loading', { isLoading: true }],
    ['failed to load', { isError: true }],
  ])('refuses to write while the book is %s', async (_label, state) => {
    const upsert = setup(state)
    const { result } = renderHook(() => useUpsertWorkspaceSafeNames())

    await expect(result.current([{ address: ADDRESS, name: 'Treasury', chainIds: ['1'] }])).resolves.toEqual({
      error: 'The Workspace address book is unavailable. Try again in a moment.',
    })
    expect(upsert).not.toHaveBeenCalled()
  })
})
