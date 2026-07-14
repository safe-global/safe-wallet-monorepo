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
const isSmartContractImpl = jest.fn()

jest.mock('@/utils/wallets', () => ({
  isSmartContract: (...args: unknown[]) => isSmartContractImpl(...args),
}))

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

const mockProvider = { getCode: jest.fn() } as unknown as Parameters<typeof persistCounterfactualSafe>[0]['provider']

const baseArgs = {
  chainId: '100',
  safeAddress: '0xSafe',
  props,
  name: 'MySafe',
  payMethod: PayMethod.PayLater,
  isAdminOfActiveSpace: true,
  provider: mockProvider,
}

describe('persistCounterfactualSafe', () => {
  beforeEach(() => {
    userInitiate.mockClear()
    userDeleteInitiate.mockClear()
    spaceInitiate.mockClear()
    replayImpl.mockClear()
    enqueueImpl.mockClear()
    showNotificationImpl.mockClear()
    isSmartContractImpl.mockReset()
    isSmartContractImpl.mockResolvedValue(false)
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

  it('returns a conflict message when the backend responds 409', async () => {
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
      expect(result.error.message).toMatch(/counterfactual account/i)
    }
  })

  it('skips the POST and Redux add and reports skipped when the Safe is already deployed', async () => {
    isSmartContractImpl.mockResolvedValue(true)
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).not.toHaveBeenCalled()
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(replayImpl).not.toHaveBeenCalled()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.skipped).toBe('already-deployed')
  })

  it('skips the deployment check and persists when no provider is passed', async () => {
    isSmartContractImpl.mockResolvedValue(true)
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      provider: undefined,
      spaceId: null,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(isSmartContractImpl).not.toHaveBeenCalled()
    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(replayImpl).toHaveBeenCalled()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.skipped).toBeUndefined()
  })

  it('proceeds with the persist when the deployment check fails (fail-open)', async () => {
    isSmartContractImpl.mockRejectedValue(new Error('rpc down'))
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: null,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(replayImpl).toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })

  it('passes the provided provider to the deployment check', async () => {
    const provider = { getCode: jest.fn() } as unknown as Parameters<typeof persistCounterfactualSafe>[0]['provider']
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: null,
      isUserAuthenticated: true,
      provider,
      dispatch,
    })

    expect(isSmartContractImpl).toHaveBeenCalledWith('0xSafe', provider)
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

  it('keeps the user-level safe and shows the backend message as a toast when the space POST fails with a 400 (stale-snapshot limit)', async () => {
    const backendMessage = 'This space only allows a maximum of 40 safe accounts'
    const dispatch = jest.fn((action) => {
      if (action.type === 'space-create-thunk') return { error: { status: 400, data: { message: backendMessage } } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userDeleteInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalled()
    expect(showNotificationImpl).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'info', groupKey: 'cf-safe-space-limit', message: backendMessage }),
    )
    expect(result.ok).toBe(true)
  })

  it('rolls back and fails the chain on a 400 limit rejection during multi-chain creation', async () => {
    const backendMessage = 'This space only allows a maximum of 40 safe accounts'
    const dispatch = jest.fn((action) => {
      if (action.type === 'space-create-thunk') return { error: { status: 400, data: { message: backendMessage } } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      isMultiChainCreation: true,
      dispatch,
    })

    expect(userDeleteInitiate).toHaveBeenCalledWith({
      deleteCounterfactualSafesDto: { safes: [{ chainId: '100', address: '0xSafe' }] },
    })
    expect(replayImpl).not.toHaveBeenCalled()
    expect(showNotificationImpl).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'info', groupKey: 'cf-safe-space-limit', message: backendMessage }),
    )
    expect(result).toEqual({ ok: false, error: expect.any(Error) })
  })

  it('rolls back and fails when the space POST returns a non-limit 400 (e.g. validation error)', async () => {
    const backendMessage = 'Validation failed (uuid is expected)'
    const dispatch = jest.fn((action) => {
      if (action.type === 'space-create-thunk') return { error: { status: 400, data: { message: backendMessage } } }
      return action
    }) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: MOCK_SPACE_UUID,
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userDeleteInitiate).toHaveBeenCalled()
    expect(showNotificationImpl).not.toHaveBeenCalled()
    expect(replayImpl).not.toHaveBeenCalled()
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
