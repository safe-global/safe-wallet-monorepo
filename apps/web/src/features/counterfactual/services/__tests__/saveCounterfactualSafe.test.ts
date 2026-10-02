import { saveCounterfactualSafe, type SaveCounterfactualSafeArgs } from '../saveCounterfactualSafe'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { AppDispatch } from '@/store'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { getGenericErrorWithStatus } from '@/utils/rtkQuery'
import { removeUndeployedSafe } from '../../store/undeployedSafesSlice'

const userInitiate = jest.fn()
const replayImpl = jest.fn()
const isSmartContractImpl = jest.fn()

jest.mock('@/utils/wallets', () => ({
  isSmartContract: (...args: unknown[]) => isSmartContractImpl(...args),
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

const mockProvider = { getCode: jest.fn() } as unknown as SaveCounterfactualSafeArgs['provider']

const dispatchReturning = (userCreateResult?: { error: unknown }) =>
  jest.fn((action: { type: string }) =>
    action.type === 'user-create-thunk' && userCreateResult ? userCreateResult : action,
  ) as unknown as AppDispatch

const save = (overrides: Partial<SaveCounterfactualSafeArgs> = {}) =>
  saveCounterfactualSafe({
    chainId: '100',
    safeAddress: '0xSafe',
    props,
    name: 'MySafe',
    payMethod: PayMethod.PayLater,
    isUserAuthenticated: true,
    provider: mockProvider,
    dispatch: dispatchReturning(),
    ...overrides,
  })

describe('saveCounterfactualSafe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isSmartContractImpl.mockResolvedValue(false)
  })

  it('saves to the backend and then to Redux when signed in', async () => {
    const dispatch = dispatchReturning()

    const result = await save({ dispatch })

    expect(userInitiate).toHaveBeenCalledTimes(1)
    expect(replayImpl).toHaveBeenCalledWith('100', '0xSafe', props, 'MySafe', dispatch, PayMethod.PayLater)
    expect(result).toEqual({ status: 'saved' })
  })

  it('fails without touching Redux when the backend rejects the Safe', async () => {
    const result = await save({ dispatch: dispatchReturning({ error: { status: 500 } }) })

    expect(replayImpl).not.toHaveBeenCalled()
    expect(result).toEqual({ status: 'failed', error: new Error(getGenericErrorWithStatus(500)) })
  })

  it('surfaces the backend message of a non-409 rejection', async () => {
    const backendMessage = 'Safe account name is too long'

    const result = await save({
      dispatch: dispatchReturning({ error: { status: 422, data: { message: backendMessage } } }),
    })

    expect(result).toEqual({ status: 'failed', error: new Error(backendMessage) })
  })

  it('stores the Safe as deployed in My accounts on a backend 409', async () => {
    const dispatch = dispatchReturning({ error: { status: 409 } })

    const result = await save({ dispatch })

    expect(result).toEqual({ status: 'already-deployed' })
    expect(replayImpl).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(
      addOrUpdateSafe({
        safe: expect.objectContaining({
          chainId: '100',
          address: { value: '0xSafe', name: 'MySafe' },
          threshold: 1,
          owners: [{ value: '0xabc' }],
        }),
      }),
    )
    expect(dispatch).toHaveBeenCalledWith(removeUndeployedSafe({ chainId: '100', address: '0xSafe' }))
  })

  it('relies on the backend 409 instead of the RPC check when signed in', async () => {
    isSmartContractImpl.mockResolvedValue(true)

    const result = await save()

    expect(isSmartContractImpl).not.toHaveBeenCalled()
    expect(result).toEqual({ status: 'saved' })
  })

  it('keeps a signed-out Safe locally without calling the backend', async () => {
    const result = await save({ isUserAuthenticated: false })

    expect(userInitiate).not.toHaveBeenCalled()
    expect(replayImpl).toHaveBeenCalled()
    expect(result).toEqual({ status: 'saved' })
  })

  it('stores a signed-out Safe as deployed when the RPC check finds it on chain', async () => {
    isSmartContractImpl.mockResolvedValue(true)
    const dispatch = dispatchReturning()

    const result = await save({ isUserAuthenticated: false, dispatch })

    expect(isSmartContractImpl).toHaveBeenCalledWith('0xSafe', mockProvider)
    expect(userInitiate).not.toHaveBeenCalled()
    expect(replayImpl).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(removeUndeployedSafe({ chainId: '100', address: '0xSafe' }))
    expect(result).toEqual({ status: 'already-deployed' })
  })

  it('skips the signed-out RPC check without a provider', async () => {
    isSmartContractImpl.mockResolvedValue(true)

    const result = await save({ isUserAuthenticated: false, provider: undefined })

    expect(isSmartContractImpl).not.toHaveBeenCalled()
    expect(result).toEqual({ status: 'saved' })
  })

  it('saves a signed-out Safe when the RPC check fails', async () => {
    isSmartContractImpl.mockRejectedValue(new Error('rpc down'))

    const result = await save({ isUserAuthenticated: false })

    expect(replayImpl).toHaveBeenCalled()
    expect(result).toEqual({ status: 'saved' })
  })
})
