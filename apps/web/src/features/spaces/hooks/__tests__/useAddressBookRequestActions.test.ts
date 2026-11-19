import { faker } from '@faker-js/faker'
import { act, renderHook } from '@/tests/test-utils'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/public/utils/elevation'
import { getStoreInstance } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { useAddressBookRequestActions } from '../useAddressBookRequestActions'
import { useCurrentSpaceId } from '../../public/hooks/useCurrentSpaceId'

const mockApprove = jest.fn()
const mockReject = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsApproveRequestV1Mutation: () => [mockApprove],
  useAddressBookRequestsRejectRequestV1Mutation: () => [mockReject],
}))
jest.mock('../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))

const SPACE_ID = 'space-uuid'
const ELEVATION_REQUIRED = { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } }

const setup = (spaceId: string | null = SPACE_ID) => {
  jest.mocked(useCurrentSpaceId).mockReturnValue(spaceId)
  return renderHook(() => useAddressBookRequestActions()).result
}

const notifications = () => selectNotifications(getStoreInstance().getState())

describe('useAddressBookRequestActions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('approves the request and confirms the contact was added', async () => {
    const requestId = faker.number.int()
    mockApprove.mockResolvedValue({})
    const result = setup()

    await act(() => result.current.approve(requestId))

    expect(mockApprove).toHaveBeenCalledWith({ spaceId: SPACE_ID, requestId })
    expect(notifications()).toEqual([
      expect.objectContaining({ variant: 'success', message: 'Contact added to Workspace address book' }),
    ])
  })

  it('shows the gateway message when approving fails', async () => {
    mockApprove.mockResolvedValue({
      error: { status: 400, data: { message: 'Only pending requests can be approved.' } },
    })
    const result = setup()

    await act(() => result.current.approve(faker.number.int()))

    expect(notifications()).toEqual([
      expect.objectContaining({ variant: 'error', message: 'Only pending requests can be approved.' }),
    ])
  })

  it('stays quiet when approving needs a step-up, which shows its own prompt', async () => {
    mockApprove.mockResolvedValue({ error: ELEVATION_REQUIRED })
    const result = setup()

    await act(() => result.current.approve(faker.number.int()))

    expect(notifications()).toEqual([])
  })

  it('rejects the request and confirms it', async () => {
    const requestId = faker.number.int()
    mockReject.mockResolvedValue({})
    const result = setup()

    await act(() => result.current.reject(requestId))

    expect(mockReject).toHaveBeenCalledWith({ spaceId: SPACE_ID, requestId })
    expect(notifications()).toEqual([expect.objectContaining({ variant: 'success', message: 'Request rejected' })])
  })

  it('tells the admin when rejecting fails', async () => {
    mockReject.mockResolvedValue({ error: { status: 500 } })
    const result = setup()

    await act(() => result.current.reject(faker.number.int()))

    expect(notifications()).toEqual([
      expect.objectContaining({ variant: 'error', message: 'Failed to reject request' }),
    ])
  })

  it('marks the request under review until the gateway answers', async () => {
    const requestId = faker.number.int()
    let answer: (value: object) => void = () => {}
    mockApprove.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    const result = setup()

    let approving: Promise<void> = Promise.resolve()
    act(() => {
      approving = result.current.approve(requestId)
    })
    expect(result.current.reviewingId).toBe(requestId)

    await act(async () => {
      answer({})
      await approving
    })
    expect(result.current.reviewingId).toBeNull()
  })

  it('clears the request under review when approving fails', async () => {
    mockApprove.mockResolvedValue({ error: { status: 500 } })
    const result = setup()

    await act(() => result.current.approve(faker.number.int()))

    expect(result.current.reviewingId).toBeNull()
  })

  it('tells the admin something went wrong when rejecting throws', async () => {
    mockReject.mockRejectedValue(new Error('network down'))
    const result = setup()

    await act(() => result.current.reject(faker.number.int()))

    expect(notifications()).toEqual([expect.objectContaining({ variant: 'error', message: 'Something went wrong' })])
    expect(result.current.reviewingId).toBeNull()
  })

  it('does nothing outside a Workspace', async () => {
    const result = setup(null)

    await act(() => result.current.approve(faker.number.int()))
    await act(() => result.current.reject(faker.number.int()))

    expect(mockApprove).not.toHaveBeenCalled()
    expect(mockReject).not.toHaveBeenCalled()
  })
})
