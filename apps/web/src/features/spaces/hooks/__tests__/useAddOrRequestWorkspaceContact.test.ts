import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { renderHook } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { getStoreInstance } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { useAddOrRequestWorkspaceContact } from '../useAddOrRequestWorkspaceContact'
import { useCurrentSpaceId } from '../useCurrentSpaceId'
import { useSpaceAddressBookState } from '../useGetSpaceAddressBook'
import { useIsAdmin, useIsInvited } from '../useSpaceMembers'
import { useUpsertWorkspaceSafeNames } from '../useUpsertWorkspaceSafeName'

const mockCreateRequest = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsCreateRequestV1Mutation: () => [mockCreateRequest],
}))
jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))
jest.mock('../useGetSpaceAddressBook', () => ({ __esModule: true, useSpaceAddressBookState: jest.fn() }))
jest.mock('../useSpaceMembers', () => ({ useIsAdmin: jest.fn(), useIsInvited: jest.fn() }))
jest.mock('../useUpsertWorkspaceSafeName', () => ({ useUpsertWorkspaceSafeNames: jest.fn() }))

const SPACE_ID = 'space-uuid'
const SOURCE = SPACE_LABELS.proposer_role_flow
const ADDRESS = '0x1111111111111111111111111111111111111111'
const CONTACT = { address: ADDRESS, name: 'Nicole', chainIds: ['137'] }

const workspaceContact = (chainIds: string[]): SpaceAddressBookItemDto => ({
  ...CONTACT,
  chainIds,
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
})

const setup = ({
  isAdmin = true,
  isInvited = false,
  spaceId = SPACE_ID,
  addressBook = [],
  upsertResult = {},
  requestResult = {},
}: {
  isAdmin?: boolean
  isInvited?: boolean
  spaceId?: string | null
  addressBook?: SpaceAddressBookItemDto[]
  upsertResult?: { error?: string }
  requestResult?: unknown
} = {}) => {
  const upsert = jest.fn().mockResolvedValue(upsertResult)
  mockCreateRequest.mockResolvedValue(requestResult)
  jest.mocked(useIsAdmin).mockReturnValue(isAdmin)
  jest.mocked(useIsInvited).mockReturnValue(isInvited)
  jest.mocked(useCurrentSpaceId).mockReturnValue(spaceId)
  jest.mocked(useUpsertWorkspaceSafeNames).mockReturnValue(upsert)
  jest.mocked(useSpaceAddressBookState).mockReturnValue({ items: addressBook, isLoading: false, isError: false })

  const { result } = renderHook(() => useAddOrRequestWorkspaceContact(SOURCE))
  return { addOrRequest: result.current, upsert, createRequest: mockCreateRequest }
}

const notifications = () => selectNotifications(getStoreInstance().getState())

describe('useAddOrRequestWorkspaceContact', () => {
  beforeEach(() => jest.clearAllMocks())

  it('adds the contact to the Workspace address book for an admin, confirms and tracks it', async () => {
    const { addOrRequest, upsert, createRequest } = setup()

    await expect(addOrRequest({ ...CONTACT, name: '  Nicole  ' })).resolves.toBe('added')
    expect(notifications()).toEqual([
      expect.objectContaining({ variant: 'success', message: 'Contact added to Workspace address book' }),
    ])

    expect(upsert).toHaveBeenCalledWith([CONTACT])
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED, {
      [MixpanelEventParams.SOURCE]: SOURCE,
    })
    expect(createRequest).not.toHaveBeenCalled()
  })

  it('requests the contact for a member, confirms and tracks the request', async () => {
    const { addOrRequest, upsert, createRequest } = setup({ isAdmin: false })

    await expect(addOrRequest(CONTACT)).resolves.toBe('requested')
    expect(notifications()).toEqual([
      expect.objectContaining({ variant: 'info', message: 'Added to Workspace address book on admin approval' }),
    ])

    expect(createRequest).toHaveBeenCalledWith({ spaceId: SPACE_ID, createAddressBookRequestDto: CONTACT })
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.ADDRESS_REQUEST_SENT, { [MixpanelEventParams.SOURCE]: SOURCE })
    expect(upsert).not.toHaveBeenCalled()
  })

  it.each([
    ['the name is empty', { name: '   ' }, {}],
    ['there is no Workspace', {}, { spaceId: null }],
    ['the member is only invited', {}, { isAdmin: false, isInvited: true }],
    ['the Workspace already holds the name on that chain', {}, { addressBook: [workspaceContact(['1', '137'])] }],
  ])('sends nothing when %s', async (_, contact, options) => {
    const { addOrRequest, upsert, createRequest } = setup(options)

    await expect(addOrRequest({ ...CONTACT, ...contact })).resolves.toBe('skipped')

    expect(upsert).not.toHaveBeenCalled()
    expect(createRequest).not.toHaveBeenCalled()
  })

  it('adds a known contact again for a chain the Workspace does not hold yet', async () => {
    const { addOrRequest, upsert } = setup({ addressBook: [workspaceContact(['1'])] })

    await addOrRequest(CONTACT)

    expect(upsert).toHaveBeenCalledWith([CONTACT])
  })

  it('shows the error when the admin write fails', async () => {
    const { addOrRequest } = setup({ upsertResult: { error: 'Forbidden' } })

    await expect(addOrRequest(CONTACT)).resolves.toBe('failed')

    expect(notifications()).toEqual(
      expect.arrayContaining([expect.objectContaining({ variant: 'error', message: 'Forbidden' })]),
    )
    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('shows the error when the member request fails', async () => {
    const { addOrRequest } = setup({
      isAdmin: false,
      requestResult: { error: { status: 403, data: { message: 'Forbidden' } } },
    })

    await addOrRequest(CONTACT)

    expect(notifications()).toEqual(
      expect.arrayContaining([expect.objectContaining({ variant: 'error', message: 'Forbidden' })]),
    )
  })

  it('reports an already pending request without a toast', async () => {
    const { addOrRequest } = setup({ isAdmin: false, requestResult: { error: { status: 409 } } })

    await expect(addOrRequest(CONTACT)).resolves.toBe('pending')

    expect(notifications()).toEqual([])
    expect(trackEvent).not.toHaveBeenCalled()
  })
})
