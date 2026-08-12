import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['billing'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      billingGetSubscriptionsV1: build.query<BillingGetSubscriptionsV1ApiResponse, BillingGetSubscriptionsV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/billing/spaces/${queryArg.spaceId}/subscriptions`,
          params: {
            status: queryArg.status,
          },
        }),
        providesTags: ['billing'],
      }),
      billingGetPlanV1: build.query<BillingGetPlanV1ApiResponse, BillingGetPlanV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/billing/plans/${queryArg.planId}` }),
        providesTags: ['billing'],
      }),
      billingGetSessionUrlV1: build.query<BillingGetSessionUrlV1ApiResponse, BillingGetSessionUrlV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/billing/spaces/${queryArg.spaceId}/session-url`,
          params: {
            returnUrl: queryArg.returnUrl,
          },
        }),
        providesTags: ['billing'],
      }),
      billingGetSpacePaymentLinksV1: build.query<
        BillingGetSpacePaymentLinksV1ApiResponse,
        BillingGetSpacePaymentLinksV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/billing/spaces/${queryArg.spaceId}/payment-links` }),
        providesTags: ['billing'],
      }),
      billingGetCheckoutUrlV1: build.query<BillingGetCheckoutUrlV1ApiResponse, BillingGetCheckoutUrlV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/billing/spaces/${queryArg.spaceId}/payment-links/${queryArg.paymentLinkId}/checkout-url`,
          params: {
            returnUrl: queryArg.returnUrl,
          },
        }),
        providesTags: ['billing'],
      }),
      billingGetCheckoutSessionV1: build.query<
        BillingGetCheckoutSessionV1ApiResponse,
        BillingGetCheckoutSessionV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/billing/sessions/${queryArg.sessionId}` }),
        providesTags: ['billing'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type BillingGetSubscriptionsV1ApiResponse = /** status 200  */ Subscription[]
export type BillingGetSubscriptionsV1ApiArg = {
  status?: string
  /** Space UUID */
  spaceId: string
}
export type BillingGetPlanV1ApiResponse = /** status 200  */ Plan
export type BillingGetPlanV1ApiArg = {
  planId: string
}
export type BillingGetSessionUrlV1ApiResponse = /** status 200  */ UrlResponse
export type BillingGetSessionUrlV1ApiArg = {
  returnUrl: string
  /** Space UUID */
  spaceId: string
}
export type BillingGetSpacePaymentLinksV1ApiResponse = /** status 200  */ PaymentLink[]
export type BillingGetSpacePaymentLinksV1ApiArg = {
  /** Space UUID */
  spaceId: string
}
export type BillingGetCheckoutUrlV1ApiResponse = /** status 200  */ CheckoutSessionResult
export type BillingGetCheckoutUrlV1ApiArg = {
  /** Payment link identifier */
  paymentLinkId: string
  returnUrl: string
  /** Space UUID */
  spaceId: string
}
export type BillingGetCheckoutSessionV1ApiResponse = /** status 200  */ CheckoutSession
export type BillingGetCheckoutSessionV1ApiArg = {
  sessionId: string
}
export type SubscriptionPlan = {
  id: string
  name?: string | null
  description?: string | null
  currentPrice: number
  originalPrice: number | null
  paymentMethod: 'fiat'
  currency: 'usd' | 'eur'
  features: string[]
  billingCycle?: ('month' | 'year') | null
  type: 'standard' | 'premium' | 'enterprise'
  product: string | null
}
export type Subscription = {
  id: string
  customerId: string
  upstreamCustomerId: string
  plan: SubscriptionPlan
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid'
  createdAt: number
  startAt: number
  cancelledAt: number | null
  cancelAt: number | null
  validUntil?: number | null
  metadata?: object | null
}
export type MarketingFeature = {
  name: string
}
export type Product = {
  id: string
  active: boolean
  description: string
  marketingFeatures: MarketingFeature[]
  metadata: object
  name: string
}
export type Plan = {
  id: string
  name?: string | null
  description?: string | null
  currentPrice: number
  originalPrice: number | null
  paymentMethod: 'fiat'
  currency: 'usd' | 'eur'
  features: string[]
  billingCycle?: ('month' | 'year') | null
  type: 'standard' | 'premium' | 'enterprise'
  product: Product
}
export type UrlResponse = {
  url: string
}
export type PaymentLink = {
  id: string
  url: string
  active: boolean
  metadata: object
  customText?: object
  afterCompletion?: object
  lineItems?: object[]
}
export type CheckoutSessionResult = {
  sessionId: string
  url: string
}
export type CheckoutSession = {
  id: string
  object: string
  amountSubtotal: number
  amountTotal: number
  cancelUrl: string
  clientReferenceId?: object | null
  created: number
  currency: string
  customer?: object | null
  expiresAt: number
  metadata: object
  mode: string
  paymentStatus: string
  status: string
  successUrl: string
  url?: object | null
  subscription?: object | null
  invoice?: object | null
}
export const {
  useBillingGetSubscriptionsV1Query,
  useLazyBillingGetSubscriptionsV1Query,
  useBillingGetPlanV1Query,
  useLazyBillingGetPlanV1Query,
  useBillingGetSessionUrlV1Query,
  useLazyBillingGetSessionUrlV1Query,
  useBillingGetSpacePaymentLinksV1Query,
  useLazyBillingGetSpacePaymentLinksV1Query,
  useBillingGetCheckoutUrlV1Query,
  useLazyBillingGetCheckoutUrlV1Query,
  useBillingGetCheckoutSessionV1Query,
  useLazyBillingGetCheckoutSessionV1Query,
} = injectedRtkApi
