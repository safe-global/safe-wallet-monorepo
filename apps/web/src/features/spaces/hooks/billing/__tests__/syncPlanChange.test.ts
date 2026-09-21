import { syncPlanChange } from '../syncPlanChange'
import { refreshSpaceEntitlements } from '@/services/entitlements/refreshSpaceEntitlements'
import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'

jest.mock('@/services/entitlements/refreshSpaceEntitlements', () => ({ refreshSpaceEntitlements: jest.fn() }))

const mockRefresh = refreshSpaceEntitlements as jest.Mock
const dispatch = jest.fn()
const entitlements = (planId: string) => Promise.resolve({ data: { plan: { id: planId } } })

describe('syncPlanChange', () => {
  beforeEach(() => jest.clearAllMocks())

  it('re-reads the entitlements until they name the new plan, then refetches the billing queries', async () => {
    mockRefresh
      .mockReturnValueOnce(entitlements('price_old'))
      .mockReturnValueOnce(entitlements('price_old'))
      .mockReturnValueOnce(entitlements('price_new'))

    const synced = await syncPlanChange(dispatch, 'space-1', 'price_new', { intervalMs: 0 })

    expect(synced).toBe(true)
    expect(mockRefresh).toHaveBeenCalledTimes(3)
    expect(mockRefresh).toHaveBeenCalledWith(dispatch, 'space-1')
    expect(dispatch).toHaveBeenCalledWith(billingApi.util.invalidateTags(['billing']))
  })

  it('gives up without refetching the offers when the webhook does not land in time', async () => {
    mockRefresh.mockImplementation(() => entitlements('price_old'))

    const synced = await syncPlanChange(dispatch, 'space-1', 'price_new', { intervalMs: 0, timeoutMs: 0 })

    expect(synced).toBe(false)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(dispatch).not.toHaveBeenCalled()
  })
})
