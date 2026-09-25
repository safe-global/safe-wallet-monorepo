import { syncPlanChange } from '../syncPlanChange'
import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'

const mockInitiate = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/entitlements', () => ({
  cgwApi: { endpoints: { entitlementsGetEntitlementsV1: { initiate: (...args: unknown[]) => mockInitiate(...args) } } },
}))

const dispatch = jest.fn().mockImplementation((action: unknown) => action)
const entitlements = (planId: string) => Promise.resolve({ data: { plan: { id: planId } } })
const invalidateBilling = billingApi.util.invalidateTags(['billing'])

describe('syncPlanChange', () => {
  beforeEach(() => jest.clearAllMocks())

  it('re-reads the entitlements until they name the new plan, then refetches the billing queries', async () => {
    mockInitiate
      .mockReturnValueOnce(entitlements('price_old'))
      .mockReturnValueOnce(entitlements('price_old'))
      .mockReturnValueOnce(entitlements('price_new'))

    const synced = await syncPlanChange(dispatch, 'space-1', 'price_new', { intervalMs: 0 })

    expect(synced).toBe(true)
    expect(mockInitiate).toHaveBeenCalledTimes(3)
    expect(mockInitiate).toHaveBeenCalledWith({ spaceId: 'space-1' }, { subscribe: false, forceRefetch: true })
    expect(dispatch).toHaveBeenCalledWith(invalidateBilling)
  })

  it('gives up without refetching the offers when the webhook does not land in time', async () => {
    mockInitiate.mockImplementation(() => entitlements('price_old'))

    const synced = await syncPlanChange(dispatch, 'space-1', 'price_new', { intervalMs: 0, timeoutMs: 0 })

    expect(synced).toBe(false)
    expect(mockInitiate).toHaveBeenCalledTimes(1)
    expect(dispatch).not.toHaveBeenCalledWith(invalidateBilling)
  })
})
