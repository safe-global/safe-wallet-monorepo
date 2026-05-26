import { persistCounterfactualSafe } from '../persistCounterfactualSafe'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { AppDispatch } from '@/store'

const userInitiate = jest.fn()
const userDeleteInitiate = jest.fn()
const spaceInitiate = jest.fn()
const replayImpl = jest.fn()
const enqueueImpl = jest.fn()

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
}

describe('persistCounterfactualSafe', () => {
  beforeEach(() => {
    userInitiate.mockClear()
    userDeleteInitiate.mockClear()
    spaceInitiate.mockClear()
    replayImpl.mockClear()
    enqueueImpl.mockClear()
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
      spaceId: '42',
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).toHaveBeenCalledWith({
      spaceId: 42,
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
      spaceId: '42',
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
      spaceId: '42',
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
      spaceId: '42',
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
      spaceId: '42',
      isUserAuthenticated: true,
      dispatch,
    })

    expect(userDeleteInitiate).toHaveBeenCalled()
    expect(enqueueImpl).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
  })

  it('skips the space POST when spaceId is non-numeric (legacy persisted state)', async () => {
    const dispatch = jest.fn((action) => ({ ...action })) as unknown as AppDispatch

    const result = await persistCounterfactualSafe({
      ...baseArgs,
      spaceId: 'abc',
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
      spaceId: '42',
      isUserAuthenticated: false,
      dispatch,
    })

    expect(userInitiate).not.toHaveBeenCalled()
    expect(spaceInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })
})
