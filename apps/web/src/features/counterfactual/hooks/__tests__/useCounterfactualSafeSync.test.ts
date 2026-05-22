import { renderHook, act } from '@testing-library/react'

// Capture calls to the user/space CF endpoints so we can assert re-sync behavior.
const userInitiate = jest.fn()
const spaceInitiate = jest.fn()
const deleteInitiate = jest.fn()
let userResponse: unknown = { safes: {} }
let spaceResponse: unknown = { safes: {} }
let deleteShouldFail = false
let pendingDeletesState: { chainId: string; address: string }[] = []
let userFailureCount = 0

const makeThunk = (data: unknown) => ({
  unwrap: () => Promise.resolve(data),
  unsubscribe: jest.fn(),
})

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes', () => ({
  cgwApi: {
    endpoints: {
      counterfactualSafesGetV1: {
        initiate: (...args: unknown[]) => {
          userInitiate(...args)
          if (userFailureCount > 0) {
            userFailureCount--
            return {
              unwrap: () => Promise.reject(new Error('transient GET failure')),
              unsubscribe: jest.fn(),
            }
          }
          return makeThunk(userResponse)
        },
      },
      counterfactualSafesDeleteV1: {
        initiate: (arg: unknown) => {
          deleteInitiate(arg)
          return {
            unwrap: () => (deleteShouldFail ? Promise.reject(new Error('boom')) : Promise.resolve({ ok: true })),
          }
        },
      },
    },
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  cgwApi: {
    endpoints: {
      spaceCounterfactualSafesGetV1: {
        initiate: (...args: unknown[]) => {
          spaceInitiate(...args)
          return makeThunk(spaceResponse)
        },
      },
    },
  },
}))

const dispatched: unknown[] = []
const dispatchFn = jest.fn((thunk: unknown) => {
  dispatched.push(thunk)
  if (typeof thunk === 'function') return thunk()
  return thunk
})

// Stub the shared store instance so getStoreInstance() doesn't throw.
jest.mock('@/store', () => ({
  useAppDispatch: () => dispatchFn,
  useAppSelector: jest.fn(),
  getStoreInstance: () => ({
    getState: () => ({ undeployedSafes: {}, pendingCfDeletes: pendingDeletesState }),
  }),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: Symbol('isAuthenticated'),
  selectIsStoreHydrated: Symbol('selectIsStoreHydrated'),
  lastUsedSpace: Symbol('lastUsedSpace'),
  setCfSafeSynced: (payload: boolean) => ({ type: 'setCfSafeSynced', payload }),
}))

jest.mock('../../store/undeployedSafesSlice', () => ({
  addUndeployedSafe: (payload: unknown) => ({ type: 'addUndeployedSafe', payload }),
  selectUndeployedSafes: () => ({}),
}))

jest.mock('../../store/pendingCfDeletesSlice', () => ({
  removePendingCfDelete: (payload: unknown) => ({ type: 'removePendingCfDelete', payload }),
  selectPendingCfDeletes: (state: { pendingCfDeletes: unknown[] }) => state.pendingCfDeletes,
}))

import { useAppSelector } from '@/store'
import useCounterfactualSafeSync from '../useCounterfactualSafeSync'
import { isAuthenticated, selectIsStoreHydrated, lastUsedSpace } from '@/store/authSlice'

const mockSelectors = (authenticated: boolean, hydrated: boolean, spaceId: string | null) => {
  ;(useAppSelector as jest.Mock).mockImplementation((selector: unknown) => {
    if (selector === isAuthenticated) return authenticated
    if (selector === selectIsStoreHydrated) return hydrated
    if (selector === lastUsedSpace) return spaceId
    return undefined
  })
}

const flush = () => act(async () => {})

describe('useCounterfactualSafeSync', () => {
  beforeEach(() => {
    userInitiate.mockClear()
    spaceInitiate.mockClear()
    deleteInitiate.mockClear()
    dispatchFn.mockClear()
    dispatched.length = 0
    userResponse = { safes: {} }
    spaceResponse = { safes: {} }
    deleteShouldFail = false
    pendingDeletesState = []
    userFailureCount = 0
    ;(useAppSelector as jest.Mock).mockReset()
  })

  it('does nothing until the store has hydrated', async () => {
    mockSelectors(true, false, null)
    renderHook(() => useCounterfactualSafeSync())
    await flush()

    expect(userInitiate).not.toHaveBeenCalled()
    expect(spaceInitiate).not.toHaveBeenCalled()
  })

  it('does nothing when user is not authenticated', async () => {
    mockSelectors(false, true, null)
    renderHook(() => useCounterfactualSafeSync())
    await flush()

    expect(userInitiate).not.toHaveBeenCalled()
    expect(spaceInitiate).not.toHaveBeenCalled()
  })

  it('fetches user CF safes once on mount when authenticated without a space', async () => {
    mockSelectors(true, true, null)
    renderHook(() => useCounterfactualSafeSync())
    await flush()

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).not.toHaveBeenCalled()
  })

  it('fetches space CF safes when a space is active', async () => {
    mockSelectors(true, true, '42')
    renderHook(() => useCounterfactualSafeSync())
    await flush()

    expect(spaceInitiate).toHaveBeenCalledWith({ spaceId: 42 })
  })

  it('re-fetches when spaceId changes', async () => {
    mockSelectors(true, true, '1')
    const { rerender } = renderHook(() => useCounterfactualSafeSync())
    await flush()
    expect(spaceInitiate).toHaveBeenCalledWith({ spaceId: 1 })

    // Switch to another space — hook must re-run and fetch the new space's safes.
    mockSelectors(true, true, '2')
    rerender()
    await flush()

    expect(spaceInitiate).toHaveBeenCalledWith({ spaceId: 2 })
    expect(spaceInitiate).toHaveBeenCalledTimes(2)
  })

  it('does not call the space endpoint when spaceId is non-numeric (legacy persisted state)', async () => {
    mockSelectors(true, true, 'abc')
    renderHook(() => useCounterfactualSafeSync())
    await flush()

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).not.toHaveBeenCalled()
  })

  it('does not re-fetch when the same spaceId is retained across rerenders', async () => {
    mockSelectors(true, true, '1')
    const { rerender } = renderHook(() => useCounterfactualSafeSync())
    await flush()

    mockSelectors(true, true, '1')
    rerender()
    await flush()

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).toHaveBeenCalledTimes(1)
  })

  it('flushes pending CF deletes before fetching, removing each entry on success', async () => {
    pendingDeletesState = [
      { chainId: '1', address: '0xabc' },
      { chainId: '11155111', address: '0xdef' },
    ]
    mockSelectors(true, true, null)

    renderHook(() => useCounterfactualSafeSync())
    await flush()

    expect(deleteInitiate).toHaveBeenCalledTimes(2)
    expect(deleteInitiate).toHaveBeenCalledWith({
      deleteCounterfactualSafesDto: { safes: [{ chainId: '1', address: '0xabc' }] },
    })
    expect(deleteInitiate).toHaveBeenCalledWith({
      deleteCounterfactualSafesDto: { safes: [{ chainId: '11155111', address: '0xdef' }] },
    })

    const removeActions = dispatched.filter(
      (d): d is { type: string; payload: { chainId: string; address: string } } =>
        typeof d === 'object' && d !== null && (d as { type?: string }).type === 'removePendingCfDelete',
    )
    expect(removeActions).toHaveLength(2)

    // The user endpoint must still be hit after the drain.
    expect(userInitiate).toHaveBeenCalledTimes(1)
  })

  it('keeps queued entries when the DELETE fails so they can retry on next sign-in', async () => {
    pendingDeletesState = [{ chainId: '1', address: '0xabc' }]
    deleteShouldFail = true
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockSelectors(true, true, null)

    renderHook(() => useCounterfactualSafeSync())
    await flush()

    expect(deleteInitiate).toHaveBeenCalledTimes(1)
    const removeActions = dispatched.filter(
      (d): d is { type: string } =>
        typeof d === 'object' && d !== null && (d as { type?: string }).type === 'removePendingCfDelete',
    )
    expect(removeActions).toHaveLength(0)
    consoleSpy.mockRestore()
  })

  it('does not re-add a safe whose pending DELETE was just flushed', async () => {
    // Reproduces the QA bug: user activates a CF safe while not SIWE-authenticated
    // (listener queues a pending delete), refreshes, then signs in. Even if the
    // backend GET still surfaces the safe (eg. via the space join), it must not
    // be re-added to the undeployed slice.
    const dtoBase = {
      factoryAddress: '0xF',
      masterCopy: '0xM',
      saltNonce: '0',
      safeVersion: '1.4.1',
      threshold: 1,
      owners: ['0xabc'],
      fallbackHandler: '0xFH',
      to: '0x0',
      data: '0x',
      paymentToken: null,
      payment: null,
      paymentReceiver: '0x0',
    }

    pendingDeletesState = [{ chainId: '11155111', address: '0xc21a' }]
    spaceResponse = { safes: { '11155111': [{ ...dtoBase, address: '0xc21a' }] } }
    mockSelectors(true, true, '42')

    renderHook(() => useCounterfactualSafeSync())
    await flush()

    // Flushed the pending delete
    expect(deleteInitiate).toHaveBeenCalledWith({
      deleteCounterfactualSafesDto: { safes: [{ chainId: '11155111', address: '0xc21a' }] },
    })
    // Did NOT re-add the safe to undeployedSafes despite it appearing in the GET
    const addActions = dispatched.filter(
      (d): d is { type: string; payload: { address: string } } =>
        typeof d === 'object' && d !== null && (d as { type?: string }).type === 'addUndeployedSafe',
    )
    expect(addActions.find((a) => a.payload.address === '0xc21a')).toBeUndefined()
  })

  it('tags safes from user endpoint as isCreator=true and space-only safes as isCreator=false', async () => {
    const dtoBase = {
      factoryAddress: '0xF',
      masterCopy: '0xM',
      saltNonce: '0',
      safeVersion: '1.4.1',
      threshold: 1,
      owners: ['0xabc'],
      fallbackHandler: '0xFH',
      to: '0x0',
      data: '0x',
      paymentToken: null,
      payment: null,
      paymentReceiver: '0x0',
    }

    userResponse = { safes: { '1': [{ ...dtoBase, address: '0xMine' }] } }
    spaceResponse = {
      safes: {
        '1': [
          { ...dtoBase, address: '0xMine' }, // duplicate — should remain creator
          { ...dtoBase, address: '0xOther' }, // space-only — non-creator
        ],
      },
    }

    mockSelectors(true, true, '42')
    renderHook(() => useCounterfactualSafeSync())
    await flush()

    const addActions = dispatched.filter(
      (d): d is { type: string; payload: { address: string; isCreator: boolean } } =>
        typeof d === 'object' && d !== null && (d as { type?: string }).type === 'addUndeployedSafe',
    )
    const byAddress = new Map(addActions.map((a) => [a.payload.address, a.payload.isCreator]))

    expect(byAddress.get('0xMine')).toBe(true)
    expect(byAddress.get('0xOther')).toBe(false)
  })

  it('normalizes nullable address fields from CGW to ZERO_ADDRESS', async () => {
    // CGW schema permits null for paymentReceiver / fallbackHandler / to;
    // downstream code requires strings, so the sync hook must coerce them.
    userResponse = {
      safes: {
        '1': [
          {
            address: '0xNullable',
            factoryAddress: '0xF',
            masterCopy: '0xM',
            saltNonce: '0',
            safeVersion: '1.4.1',
            threshold: 1,
            owners: ['0xabc'],
            data: '0x',
            paymentToken: null,
            payment: null,
            fallbackHandler: null,
            to: null,
            paymentReceiver: null,
          },
        ],
      },
    }

    mockSelectors(true, true, null)
    renderHook(() => useCounterfactualSafeSync())
    await flush()

    const addAction = dispatched.find(
      (
        d,
      ): d is {
        type: string
        payload: { address: string; safeProps: { safeAccountConfig: Record<string, unknown> } }
      } => typeof d === 'object' && d !== null && (d as { type?: string }).type === 'addUndeployedSafe',
    )
    expect(addAction).toBeDefined()
    const config = addAction!.payload.safeProps.safeAccountConfig
    expect(config.paymentReceiver).toBe('0x0000000000000000000000000000000000000000')
    expect(config.fallbackHandler).toBe('0x0000000000000000000000000000000000000000')
    expect(config.to).toBe('0x0000000000000000000000000000000000000000')
  })

  it('retries once after a transient GET failure and applies the result on success', async () => {
    // Without the retry, a single network blip stuck users who land on a
    // space-mate's CF safe URL on "Safe couldn't be loaded".
    jest.useFakeTimers()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    userFailureCount = 1
    userResponse = {
      safes: {
        '1': [
          {
            address: '0xRetry',
            factoryAddress: '0xF',
            masterCopy: '0xM',
            saltNonce: '0',
            safeVersion: '1.4.1',
            threshold: 1,
            owners: ['0xabc'],
            fallbackHandler: '0xFH',
            to: '0x0',
            data: '0x',
            paymentToken: null,
            payment: null,
            paymentReceiver: '0x0',
          },
        ],
      },
    }
    mockSelectors(true, true, null)

    renderHook(() => useCounterfactualSafeSync())
    // First attempt fails → catch schedules setTimeout(retry, 2000)
    await act(async () => {})
    expect(userInitiate).toHaveBeenCalledTimes(1)

    // Advance past the retry backoff so the second attempt runs
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    await act(async () => {})

    expect(userInitiate).toHaveBeenCalledTimes(2)

    const addActions = dispatched.filter(
      (d): d is { type: string; payload: { address: string } } =>
        typeof d === 'object' && d !== null && (d as { type?: string }).type === 'addUndeployedSafe',
    )
    expect(addActions.find((a) => a.payload.address === '0xRetry')).toBeDefined()

    jest.useRealTimers()
    consoleSpy.mockRestore()
  })

  it('settles cfSafeSynced=true even when both attempts fail so consumers do not wait forever', async () => {
    jest.useFakeTimers()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    userFailureCount = 2
    mockSelectors(true, true, null)

    renderHook(() => useCounterfactualSafeSync())
    await act(async () => {})
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    await act(async () => {})

    expect(userInitiate).toHaveBeenCalledTimes(2)

    const syncedActions = dispatched.filter(
      (d): d is { type: string; payload: boolean } =>
        typeof d === 'object' && d !== null && (d as { type?: string }).type === 'setCfSafeSynced',
    )
    expect(syncedActions.some((a) => a.payload === true)).toBe(true)

    jest.useRealTimers()
    consoleSpy.mockRestore()
  })
})
