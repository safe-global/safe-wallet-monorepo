import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['entitlements'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      entitlementsGetEntitlementsV1: build.query<
        EntitlementsGetEntitlementsV1ApiResponse,
        EntitlementsGetEntitlementsV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/entitlements` }),
        providesTags: ['entitlements'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type EntitlementsGetEntitlementsV1ApiResponse = /** status 200  */ EntitlementsResponse
export type EntitlementsGetEntitlementsV1ApiArg = {
  /** Space UUID */
  spaceId: string
}
export type EntitlementsPlan = {
  /** Plan identifier in the billing service */
  id: string
  name: string | null
  /** End of the current billing cycle */
  cycleEndsAt: string | null
}
export type FeatureKey = 'safe_seats'
export type BinaryEntitlement = {
  /** Feature key from the entitlements catalog. */
  feature: FeatureKey
  /** Whether the plan grants the feature at all. A metered feature reports its quota and usage even when this is false. */
  enabled: boolean
  type: 'binary'
}
export type ValueEntitlement = {
  /** Feature key from the entitlements catalog. */
  feature: FeatureKey
  /** Whether the plan grants the feature at all. A metered feature reports its quota and usage even when this is false. */
  enabled: boolean
  type: 'value'
  value: string | null
}
export type MeteredEntitlement = {
  /** Feature key from the entitlements catalog. */
  feature: FeatureKey
  /** Whether the plan grants the feature at all. A metered feature reports its quota and usage even when this is false. */
  enabled: boolean
  type: 'metered'
  /** The plan's quota, never inflated to match usage; null means unlimited. */
  quota: number | null
  /** May legally exceed `quota`. */
  used: number
  /** Null for stock-type features (seats) that have no reset window. */
  resetsAt: string | null
}
export type EntitlementsResponse = {
  /** Null when the workspace has no active subscription. */
  plan: EntitlementsPlan | null
  /** One entry per catalog feature. Which fields an entry carries is decided by `type`: a metered one always carries quota, usage and its reset window, and the others never do. */
  entitlements: (
    | ({
        type: 'binary'
      } & BinaryEntitlement)
    | ({
        type: 'value'
      } & ValueEntitlement)
    | ({
        type: 'metered'
      } & MeteredEntitlement)
  )[]
}
export const { useEntitlementsGetEntitlementsV1Query, useLazyEntitlementsGetEntitlementsV1Query } = injectedRtkApi
