import { createCounterfactualSafe } from '../createCounterfactualSafe'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { AppDispatch } from '@/store'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { removeUndeployedSafe } from '../../store/undeployedSafesSlice'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const userInitiate = jest.fn()
const spaceInitiate = jest.fn()
const replayImpl = jest.fn()
const showNotificationImpl = jest.fn()

jest.mock('@/utils/wallets', () => ({
  isSmartContract: jest.fn(),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => {
    showNotificationImpl(payload)
    return { type: 'showNotification', payload }
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes', () => ({
  cgwApi: {
    endpoints: {
      counterfactualSafesCreateV1: {
        initiate: (...args: unknown[]) => {
          userInitiate(...args)
          return { type: 'user-create-thunk', args }
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

type Responses = { spaceError?: unknown; userErrorFor?: Record<string, unknown> }

const dispatchWith = ({ spaceError, userErrorFor = {} }: Responses = {}) =>
  jest.fn((action: { type: string; args?: [{ createCounterfactualSafesDto: { safes: [{ chainId: string }] } }] }) => {
    if (action.type === 'space-create-thunk' && spaceError) return { error: spaceError }
    if (action.type === 'user-create-thunk') {
      const chainId = action.args?.[0].createCounterfactualSafesDto.safes[0].chainId ?? ''
      if (userErrorFor[chainId]) return { error: userErrorFor[chainId] }
    }
    return action
  }) as unknown as AppDispatch

const ONE = ['100']
const MANY = ['1', '100', '137']

const create = (chainIds: string[], dispatch: AppDispatch, overrides = {}) =>
  createCounterfactualSafe({
    networks: chainIds.map((chainId) => ({ chainId })),
    safeAddress: '0xSafe',
    props,
    name: 'MySafe',
    payMethod: PayMethod.PayLater,
    spaceId: MOCK_SPACE_UUID,
    isUserAuthenticated: true,
    isAdminOfActiveSpace: true,
    spaceSafeLimit: 40,
    dispatch,
    ...overrides,
  })

const saved = (chainIds: string[]) => chainIds.map((chainId) => ({ chainId, status: 'saved' }))
const removals = (dispatch: AppDispatch) =>
  (dispatch as jest.Mock).mock.calls.filter(([action]) => action.type === removeUndeployedSafe.type)

describe('createCounterfactualSafe', () => {
  beforeEach(() => jest.clearAllMocks())

  describe.each([
    ['one network', ONE],
    ['several networks', MANY],
  ])('on %s', (_, chainIds) => {
    it('saves every network and adds them all to the Workspace in one request', async () => {
      const result = await create(chainIds, dispatchWith())

      expect(userInitiate).toHaveBeenCalledTimes(chainIds.length)
      expect(replayImpl).toHaveBeenCalledTimes(chainIds.length)
      expect(spaceInitiate).toHaveBeenCalledTimes(1)
      expect(spaceInitiate).toHaveBeenCalledWith({
        spaceId: MOCK_SPACE_UUID,
        createSpaceSafesDto: { safes: chainIds.map((chainId) => ({ chainId, address: '0xSafe' })) },
      })
      expect(showNotificationImpl).not.toHaveBeenCalled()
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: false })
    })

    it('keeps every Safe and reports the pending step-up when the Workspace add needs one', async () => {
      const dispatch = dispatchWith({
        spaceError: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR, statusCode: 403 } },
      })

      const result = await create(chainIds, dispatch)

      expect(spaceInitiate).toHaveBeenCalledTimes(1)
      expect(removals(dispatch)).toHaveLength(0)
      expect(showNotificationImpl).not.toHaveBeenCalled()
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: true })
    })

    it('keeps every Safe in My accounts and toasts the quota on a 402 QUOTA_EXCEEDED', async () => {
      const dispatch = dispatchWith({ spaceError: { status: 402, data: { code: 'QUOTA_EXCEEDED', quota: 20 } } })

      const result = await create(chainIds, dispatch)

      expect(removals(dispatch)).toHaveLength(0)
      expect(showNotificationImpl).toHaveBeenCalledTimes(1)
      expect(showNotificationImpl).toHaveBeenCalledWith({
        variant: 'info',
        groupKey: 'cf-safe-space-limit',
        message:
          "Safe created in My accounts. The Workspace is at its limit of 20 Safe accounts, so it wasn't added there.",
      })
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: false })
    })

    it('keeps every Safe in My accounts and toasts the backend message on a legacy 400 limit', async () => {
      const message = 'This space only allows a maximum of 40 safe accounts'
      const dispatch = dispatchWith({ spaceError: { status: 400, data: { message } } })

      const result = await create(chainIds, dispatch)

      expect(removals(dispatch)).toHaveLength(0)
      expect(showNotificationImpl).toHaveBeenCalledWith({ variant: 'info', groupKey: 'cf-safe-space-limit', message })
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: false })
    })

    it('rolls back every saved network and fails them when the Workspace add fails', async () => {
      const dispatch = dispatchWith({ spaceError: { status: 500, data: { message: 'Boom' } } })

      const result = await create(chainIds, dispatch)

      expect(removals(dispatch).map(([action]) => action)).toEqual(
        chainIds.map((chainId) => removeUndeployedSafe({ chainId, address: '0xSafe' })),
      )
      expect(showNotificationImpl).not.toHaveBeenCalled()
      expect(result).toEqual({
        chains: chainIds.map((chainId) => ({ chainId, status: 'failed', error: new Error('Boom') })),
        isStepUpPending: false,
      })
    })

    it('skips the Workspace add and tells a non-admin to ask an admin', async () => {
      const result = await create(chainIds, dispatchWith(), { isAdminOfActiveSpace: false })

      expect(spaceInitiate).not.toHaveBeenCalled()
      expect(showNotificationImpl).toHaveBeenCalledTimes(1)
      expect(showNotificationImpl).toHaveBeenCalledWith({
        variant: 'info',
        groupKey: 'cf-safe-space-skipped',
        message: 'Safe added to your accounts — ask an admin to add it to the Workspace',
      })
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: false })
    })

    it('skips the Workspace add at the seat limit and names the limit', async () => {
      const result = await create(chainIds, dispatchWith(), { spaceSafeCount: 20, spaceSafeLimit: 20 })

      expect(spaceInitiate).not.toHaveBeenCalled()
      expect(showNotificationImpl).toHaveBeenCalledWith({
        variant: 'info',
        groupKey: 'cf-safe-space-limit',
        message:
          "Safe created in My accounts. The Workspace is at its limit of 20 Safe accounts, so it wasn't added there.",
      })
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: false })
    })

    it('adds to the Workspace at the seat limit when the address already holds a seat there', async () => {
      await create(chainIds, dispatchWith(), { spaceSafeCount: 20, spaceSafeLimit: 20, holdsSeatInSpace: true })

      expect(spaceInitiate).toHaveBeenCalledTimes(1)
      expect(showNotificationImpl).not.toHaveBeenCalled()
    })

    it('keeps a signed-out Safe locally and never calls the Workspace', async () => {
      const result = await create(chainIds, dispatchWith(), { isUserAuthenticated: false })

      expect(userInitiate).not.toHaveBeenCalled()
      expect(spaceInitiate).not.toHaveBeenCalled()
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: false })
    })

    it('saves without a Workspace request outside a Workspace', async () => {
      const result = await create(chainIds, dispatchWith(), { spaceId: null })

      expect(spaceInitiate).not.toHaveBeenCalled()
      expect(result).toEqual({ chains: saved(chainIds), isStepUpPending: false })
    })

    it('skips the Workspace add when every network is already deployed', async () => {
      const userErrorFor = Object.fromEntries(chainIds.map((chainId) => [chainId, { status: 409 }]))

      const result = await create(chainIds, dispatchWith({ userErrorFor }))

      expect(spaceInitiate).not.toHaveBeenCalled()
      expect(result).toEqual({
        chains: chainIds.map((chainId) => ({ chainId, status: 'already-deployed' })),
        isStepUpPending: false,
      })
    })
  })

  it('adds only the newly saved networks to the Workspace', async () => {
    const dispatch = dispatchWith({ userErrorFor: { '1': { status: 409 }, '137': { status: 500 } } })

    const result = await create(MANY, dispatch)

    expect(spaceInitiate).toHaveBeenCalledWith({
      spaceId: MOCK_SPACE_UUID,
      createSpaceSafesDto: { safes: [{ chainId: '100', address: '0xSafe' }] },
    })
    expect(result.chains.map((chain) => chain.status)).toEqual(['already-deployed', 'saved', 'failed'])
  })

  it('rolls back only the newly saved networks when the Workspace add fails', async () => {
    const dispatch = dispatchWith({ spaceError: { status: 500 }, userErrorFor: { '1': { status: 500 } } })

    const result = await create(MANY, dispatch)

    expect(removals(dispatch).map(([action]) => action.payload.chainId)).toEqual(['100', '137'])
    expect(result.chains.map((chain) => chain.status)).toEqual(['failed', 'failed', 'failed'])
  })
})
