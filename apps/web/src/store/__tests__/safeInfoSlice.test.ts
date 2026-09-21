import { createListenerMiddleware, type UnknownAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { safeInfoListener } from '../safeInfoSlice'
import { Errors, logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const CHAIN_ID = '5'
const SAFE_ADDRESS = '0x0000000000000000000000000000000000001234'

const rejected = (
  payload: unknown,
  { endpointName = 'safesGetSafeV1', rejectedWithValue = true } = {},
): UnknownAction => ({
  type: 'api/executeQuery/rejected',
  payload,
  meta: {
    rejectedWithValue,
    requestStatus: 'rejected',
    requestId: '1',
    aborted: false,
    condition: false,
    arg: { type: 'query', endpointName, originalArgs: { chainId: CHAIN_ID, safeAddress: SAFE_ADDRESS } },
  },
  error: { message: 'Rejected' },
})

const buildState = ({ hydrated = true, authenticated = false, cfSynced = true, undeployed = false } = {}): RootState =>
  ({
    auth: {
      sessionExpiresAt: authenticated ? Date.now() + 60_000 : undefined,
      isStoreHydrated: hydrated,
      cfSafeSynced: cfSynced,
    },
    undeployedSafes: undeployed ? { [CHAIN_ID]: { [SAFE_ADDRESS]: {} } } : {},
  }) as unknown as RootState

describe('safeInfoListener', () => {
  const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

  const run = (state: RootState, action: UnknownAction) => {
    const listenerApi = { getState: jest.fn(() => state), dispatch: jest.fn() }
    return listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)
  }

  beforeEach(() => {
    listenerMiddlewareInstance.clearListeners()
    safeInfoListener(listenerMiddlewareInstance)
    jest.clearAllMocks()
  })

  it('reports a failed safe-info load', () => {
    const payload = { status: 500, data: 'Internal Server Error' }

    run(buildState(), rejected(payload))

    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(Errors._600, payload)
  })

  it('stays silent for a 404 while the counterfactual sync is still pending', () => {
    run(buildState({ authenticated: true, cfSynced: false }), rejected({ status: 404, data: 'Not found' }))

    expect(logError).not.toHaveBeenCalled()
  })

  it('stays silent for a 404 while the store is still hydrating', () => {
    run(buildState({ hydrated: false }), rejected({ status: 404, data: 'Not found' }))

    expect(logError).not.toHaveBeenCalled()
  })

  it('still reports a real server error while the counterfactual sync is pending', () => {
    run(buildState({ authenticated: true, cfSynced: false }), rejected({ status: 500, data: 'Internal Server Error' }))

    expect(logError).toHaveBeenCalledTimes(1)
  })

  it('reports a 404 once the counterfactual sync has settled', () => {
    run(buildState({ authenticated: true, cfSynced: true }), rejected({ status: 404, data: 'Not found' }))

    expect(logError).toHaveBeenCalledTimes(1)
  })

  it('stays silent for a Safe that is still counterfactual', () => {
    run(buildState({ undeployed: true }), rejected({ status: 404, data: 'Not found' }))
    run(buildState({ undeployed: true }), rejected({ status: 500, data: 'Internal Server Error' }))

    expect(logError).not.toHaveBeenCalled()
  })

  it('ignores rejections that carry no error, such as a skipped or aborted request', () => {
    run(buildState(), rejected(undefined, { rejectedWithValue: false }))

    expect(logError).not.toHaveBeenCalled()
  })

  it('ignores other endpoints', () => {
    run(buildState(), rejected({ status: 500, data: '' }, { endpointName: 'safesGetNoncesV1' }))

    expect(logError).not.toHaveBeenCalled()
  })

  it('ignores rejections from other APIs', () => {
    run(buildState(), { ...rejected({ status: 500, data: '' }), type: 'safePass/executeQuery/rejected' })

    expect(logError).not.toHaveBeenCalled()
  })
})
