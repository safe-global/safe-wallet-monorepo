import { createListenerMiddleware } from '@reduxjs/toolkit'
import { faker } from '@faker-js/faker'
import type { RootState } from '@/store/index'
import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { planChangeSyncListener } from '../planChangeSyncListener'

const mockSyncPlanChange = jest.fn().mockResolvedValue(true)
jest.mock('../../hooks/billing/syncPlanChange', () => ({
  syncPlanChange: (...args: unknown[]) => mockSyncPlanChange(...args),
}))

const mutation = (endpointName: string, requestStatus: 'fulfilled' | 'rejected', spaceId: string, planId: string) => ({
  type: `${billingApi.reducerPath}/executeMutation/${requestStatus}`,
  payload: {},
  meta: {
    requestId: faker.string.uuid(),
    requestStatus,
    arg: {
      type: 'mutation',
      endpointName,
      originalArgs: { spaceId, subscriptionId: faker.string.alphanumeric(10), updateSubscriptionDto: { planId } },
    },
  },
})

describe('planChangeSyncListener', () => {
  const listenerMiddleware = createListenerMiddleware<RootState>()
  const dispatch = jest.fn()
  const run = (action: ReturnType<typeof mutation>) =>
    listenerMiddleware.middleware({ getState: jest.fn(), dispatch })(jest.fn())(action)

  beforeEach(() => {
    listenerMiddleware.clearListeners()
    planChangeSyncListener(listenerMiddleware)
    jest.clearAllMocks()
  })

  it('syncs the new plan once the change succeeds, replayed or not', () => {
    const spaceId = faker.string.uuid()
    const planId = faker.string.alphanumeric(12)

    run(mutation('billingUpdateSubscriptionV1', 'fulfilled', spaceId, planId))

    expect(mockSyncPlanChange).toHaveBeenCalledTimes(1)
    expect(mockSyncPlanChange).toHaveBeenCalledWith(expect.any(Function), spaceId, planId)
  })

  it('ignores failed changes and other endpoints', () => {
    const spaceId = faker.string.uuid()
    const planId = faker.string.alphanumeric(12)

    run(mutation('billingUpdateSubscriptionV1', 'rejected', spaceId, planId))
    run(mutation('billingGetCheckoutUrlV1', 'fulfilled', spaceId, planId))

    expect(mockSyncPlanChange).not.toHaveBeenCalled()
  })
})
