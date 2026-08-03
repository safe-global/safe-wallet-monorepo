import { addSafeToSpace } from '../addSafeToSpace'
import { SAFE_ACCOUNTS_LIMIT } from '../../constants'
import type { AppDispatch } from '@/store'
import { faker } from '@faker-js/faker'

const MOCK_SPACE_UUID = faker.string.uuid()

const spaceInitiate = jest.fn()
const showNotificationImpl = jest.fn()

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => {
    showNotificationImpl(payload)
    return { type: 'showNotification', payload }
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  cgwApi: {
    endpoints: {
      spaceSafesCreateV1: {
        initiate: (...args: unknown[]) => {
          spaceInitiate(...args)
          return { type: 'space-create-thunk' }
        },
      },
    },
  },
}))

const baseArgs = {
  chainId: '100',
  safeAddress: '0xSafe',
  isAdminOfActiveSpace: true,
}

describe('addSafeToSpace', () => {
  beforeEach(() => {
    spaceInitiate.mockClear()
    showNotificationImpl.mockClear()
  })

  it('POSTs the safe to the space and reports it as added', async () => {
    const dispatch = jest.fn(() => ({ data: undefined })) as unknown as AppDispatch

    const result = await addSafeToSpace({ ...baseArgs, spaceId: MOCK_SPACE_UUID, dispatch })

    expect(result).toEqual({ status: 'added' })
    expect(spaceInitiate).toHaveBeenCalledWith({
      spaceId: MOCK_SPACE_UUID,
      createSpaceSafesDto: { safes: [{ chainId: '100', address: '0xSafe' }] },
    })
    expect(showNotificationImpl).not.toHaveBeenCalled()
  })

  it.each([null, '', '   '])('skips the call when there is no usable space id (%p)', async (spaceId) => {
    const dispatch = jest.fn(() => ({ data: undefined })) as unknown as AppDispatch

    const result = await addSafeToSpace({ ...baseArgs, spaceId, dispatch })

    expect(result).toEqual({ status: 'skipped', reason: 'no-space' })
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(showNotificationImpl).not.toHaveBeenCalled()
  })

  it('skips the call and informs the user when they are not an admin', async () => {
    const dispatch = jest.fn(() => ({ data: undefined })) as unknown as AppDispatch

    const result = await addSafeToSpace({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isAdminOfActiveSpace: false,
      dispatch,
    })

    expect(result).toEqual({ status: 'skipped', reason: 'not-admin' })
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(showNotificationImpl).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'info', groupKey: 'cf-safe-space-skipped' }),
    )
  })

  it('skips the call and informs the user when the space is already full', async () => {
    const dispatch = jest.fn(() => ({ data: undefined })) as unknown as AppDispatch

    const result = await addSafeToSpace({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      spaceSafeCount: SAFE_ACCOUNTS_LIMIT,
      dispatch,
    })

    expect(result).toEqual({ status: 'skipped', reason: 'space-full' })
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(showNotificationImpl).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'info', groupKey: 'cf-safe-space-limit' }),
    )
  })

  it('still POSTs when the cached count is below the limit', async () => {
    const dispatch = jest.fn(() => ({ data: undefined })) as unknown as AppDispatch

    const result = await addSafeToSpace({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      spaceSafeCount: SAFE_ACCOUNTS_LIMIT - 1,
      dispatch,
    })

    expect(result).toEqual({ status: 'added' })
    expect(spaceInitiate).toHaveBeenCalledTimes(1)
  })

  it('reports a limit rejection separately and informs the user with the backend message', async () => {
    const dispatch = jest.fn(() => ({
      error: { status: 400, data: { message: 'This space only allows a maximum of 40 safe accounts' } },
    })) as unknown as AppDispatch

    const result = await addSafeToSpace({ ...baseArgs, spaceId: MOCK_SPACE_UUID, dispatch })

    expect(result).toEqual({
      status: 'failed',
      isLimitRejection: true,
      error: new Error('This space only allows a maximum of 40 safe accounts'),
    })
    expect(showNotificationImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'info',
        groupKey: 'cf-safe-space-limit',
        message: 'This space only allows a maximum of 40 safe accounts',
      }),
    )
  })

  it('reports other failures without notifying, leaving the caller to decide', async () => {
    const dispatch = jest.fn(() => ({ error: { status: 500 } })) as unknown as AppDispatch

    const result = await addSafeToSpace({ ...baseArgs, spaceId: MOCK_SPACE_UUID, dispatch })

    expect(result).toEqual({
      status: 'failed',
      isLimitRejection: false,
      error: new Error('Failed to add Safe account to workspace'),
    })
    expect(showNotificationImpl).not.toHaveBeenCalled()
  })

  it('treats a 400 without a limit message as an ordinary failure', async () => {
    const dispatch = jest.fn(() => ({
      error: { status: 400, data: { message: 'Invalid address' } },
    })) as unknown as AppDispatch

    const result = await addSafeToSpace({ ...baseArgs, spaceId: MOCK_SPACE_UUID, dispatch })

    expect(result).toEqual({
      status: 'failed',
      isLimitRejection: false,
      error: new Error('Invalid address'),
    })
  })
})
