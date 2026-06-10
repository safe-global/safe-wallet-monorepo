import { persistCounterfactualSafe } from '../persistCounterfactualSafe'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { AppDispatch } from '@/store'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const userInitiate = jest.fn()
const userDeleteInitiate = jest.fn()
const spaceInitiate = jest.fn()
const replayImpl = jest.fn()
const enqueueImpl = jest.fn()
const showNotificationImpl = jest.fn()

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => {
    showNotificationImpl(payload)
    return { type: 'showNotification', payload }
  },
}))

jest.mock('../../store/pendingCfDeletesSlice', () => ({
  enqueuePendingCfDelete: (payload: unknown) => {
    enqueueImpl(payload)
    return { type: 'enqueuePendingCfDelete', payload }
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes', () => ({
  cgwApi: {
    endpoints: {
      counterfactualSafesCreateV1: {
        initiate: (...args: unknown[]) => {
          userInitiate(...args)
          return { type: 'user-create-thunk' }
        },
      },
      counterfactualSafesDeleteV1: {
        initiate: (...args: unknown[]) => {
          userDeleteInitiate(...args)
          return { type: 'user-delete-thunk' }
        },
      },
    },
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

jest.mock('../safeDeployment', () => ({
  replayCounterfactualSafeDeployment: (...args: unknown[]) => replayImpl(...args),
}))

const props: ReplayedSafeProps = {
  factoryAddress: '0xFactory',
  masterCopy: '0xMaster',
  saltNonce: '1',
  safeVersion: '1.4.1',
  safeAccountConfig: {
    threshold: 1,
    owners: ['0xabc'],
    fallbackHandler: '0xFH',
    to: '0x0',
    data: '0x',
    paymentReceiver: '0x0',
  },
}

const baseArgs = {
  chainId: '100',
  safeAddress: '0xSafe',
  props,
  name: 'MySafe',
  payMethod: PayMethod.PayLater,
  isAdminOfActiveSpace: true,
}

describe('persistCounterfactualSafe', () => {
  beforeEach(() => {
    userInitiate.mockClear()
    userDeleteInitiate.mockClear()
    spaceInitiate.mockClear()
    replayImpl.mockClear()
    enqueueImpl.mockClear()
    showNotificationImpl.mockClear()
  })

  it('POSTs to user endpoint then calls replayCounterfactualSafeDeployment on success (no space)', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: null,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalledWith('100', '0xSafe', props, 'MySafe', dispatch, PayMethod.PayLater)
    expect(result.ok).toBe(true)
  })

  it('POSTs to both user and space endpoints when spaceId is set', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).toHaveBeenCalledWith({
      spaceId: MOCK_SPACE_UUID,
      createSpaceSafesDto: { safes: [{ chainId: '100', address: '0xSafe' }] },
    })
    expect(replayImpl).toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })

  it('returns ok=false and skips Redux add when user-endpoint POST fails', async () => {
    const dispatch = jest.fn((action) => {
      if (action.type === 'user-create-thunk') return { error: { status: 500 } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalled()
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(replayImpl).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, error: expect.any(Error) })
    if (!result.ok) expect(result.error.message).toMatch(/backend/i)
  })

  it('returns a user-facing conflict message when the backend responds 409 (params mismatch)', async () => {
    const dispatch = jest.fn((action) => {
      if (action.type === 'user-create-thunk') return { error: { status: 409 } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: null,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toMatch(/already exists/i)
    }
  })

  it('rolls back the user-level POST and skips Redux add when space-endpoint POST fails', async () => {
    const dispatch = jest.fn((action) => {
      if (action.type === 'space-create-thunk') return { error: { status: 500 } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalled()
    expect(spaceInitiate).toHaveBeenCalled()
    // Rollback: user-level entry deleted so the backend doesn't keep an orphan
    expect(userDeleteInitiate).toHaveBeenCalledWith({
      deleteCounterfactualSafesDto: { safes: [{ chainId: '100', address: '0xSafe' }] },
    })
    expect(replayImpl).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, error: expect.any(Error) })
    if (!result.ok) expect(result.error.message).toMatch(/space/i)
  })

  it('surfaces the backend message when the space POST fails with a 400 (e.g. account limit reached)', async () => {
    const backendMessage = 'This space only allows a maximum of 40 safe accounts, you can only add up to 0 more'
    const dispatch = jest.fn((action) => {
      if (action.type === 'space-create-thunk') return { error: { status: 400, data: { message: backendMessage } } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: '42',
      isUserAuthenticated: true,
      dispatch,
    })

    expect(result).toEqual({ ok: false, error: expect.any(Error) })
    if (!result.ok) expect(result.error.message).toBe(backendMessage)
  })

  it('queues a pending CF delete when both the space POST and the rollback DELETE fail', async () => {
    // Double-failure mode: backend has the user-level CF safe but no space link,
    // and rollback couldn't clean it up. The orphan must be queued so the next
    // sync flushes it instead of re-adding it as "Not activated".
    const dispatch = jest.fn((action) => {
      if (action.type === 'space-create-thunk') return { error: { status: 500 } }
      if (action.type === 'user-delete-thunk') return { error: { status: 500 } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalled()
    expect(spaceInitiate).toHaveBeenCalled()
    expect(userDeleteInitiate).toHaveBeenCalled()
    expect(enqueueImpl).toHaveBeenCalledWith({ chainId: '100', address: '0xSafe' })
    expect(replayImpl).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
  })

  it('does NOT queue a pending CF delete when the rollback DELETE succeeds', async () => {
    const dispatch = jest.fn((action) => {
      if (action.type === 'space-create-thunk') return { error: { status: 500 } }
      // user-delete-thunk resolves successfully (no error in result)
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userDeleteInitiate).toHaveBeenCalled()
    expect(enqueueImpl).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
  })

  it('skips the space POST when spaceId is empty (legacy persisted state)', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: '   ',
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })

  it('skips backend calls entirely when user is not authenticated but still updates Redux', async () => {
    const dispatch = jest.fn() as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: false,
      dispatch,
    })

    expect(userInitiate).not.toHaveBeenCalled()
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })

  it('skips the space POST and shows an info toast when the user is not admin of the active space', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      isAdminOfActiveSpace: false,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalled()
    expect(showNotificationImpl).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'info', groupKey: 'cf-safe-space-skipped' }),
    )
    expect(result.ok).toBe(true)
  })

  it('skips the space POST and shows an info toast when the space is already at the safe limit', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      spaceSafeCount: 40,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(userDeleteInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalled()
    expect(showNotificationImpl).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'info', groupKey: 'cf-safe-space-limit' }),
    )
    expect(result.ok).toBe(true)
  })

  it('still POSTs to the space endpoint when the space is below the safe limit', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      spaceSafeCount: 39,
      dispatch,
    })

    expect(spaceInitiate).toHaveBeenCalled()
    expect(showNotificationImpl).not.toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })

  it('does not show the skip toast when the user is admin and the space POST succeeds', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(showNotificationImpl).not.toHaveBeenCalled()
  })
})
