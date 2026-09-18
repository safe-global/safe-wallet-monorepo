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
      billingPreviewSubscriptionUpdateV1: build.query<
        BillingPreviewSubscriptionUpdateV1ApiResponse,
        BillingPreviewSubscriptionUpdateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/spaces/${queryArg.spaceId}/subscriptions/${queryArg.subscriptionId}/preview-update`,
          params: {
            planId: queryArg.planId,
          },
        }),
        providesTags: ['billing'],
      }),
      billingUpdateSubscriptionV1: build.mutation<
        BillingUpdateSubscriptionV1ApiResponse,
        BillingUpdateSubscriptionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/spaces/${queryArg.spaceId}/subscriptions/${queryArg.subscriptionId}`,
          method: 'PATCH',
          body: queryArg.updateSubscriptionDto,
        }),
        invalidatesTags: ['billing'],
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
export type BillingPreviewSubscriptionUpdateV1ApiResponse = /** status 200  */ SubscriptionUpdatePreview
export type BillingPreviewSubscriptionUpdateV1ApiArg = {
  /** Subscription identifier */
  subscriptionId: string
  /** The price id of the plan to preview */
  planId: string
  /** Space UUID */
  spaceId: string
}
export type BillingUpdateSubscriptionV1ApiResponse = /** status 200  */ UpdateSubscriptionResult
export type BillingUpdateSubscriptionV1ApiArg = {
  /** Subscription identifier */
  subscriptionId: string
  /** Space UUID */
  spaceId: string
  updateSubscriptionDto: UpdateSubscriptionDto
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
  currentPeriodStart?: number | null
  currentPeriodEnd?: number | null
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
  trialPeriodDays?: number | null
}
export type CheckoutSessionResult = {
  sessionId: string
  url: string
}
export type PreviewLineItem = {
  description: string
  /** Signed amount in minor units; negative for credit on unused time */
  amount: number
  currency: string
}
export type SubscriptionUpdatePreview = {
  amountDue: number
  currency: string
  /** Unix timestamp in seconds */
  nextBillingDate: number
  lineItems: PreviewLineItem[]
}
export type UpdateSubscriptionResult = {
  subscriptionId: string
  success: boolean
}
export type UpdateSubscriptionDto = {
  /** The price id of the plan to move the subscription onto */
  planId: string
  /** Which offered payment link sells that plan. Only needed to disambiguate when several do */
  paymentLinkId?: string
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
  useBillingPreviewSubscriptionUpdateV1Query,
  useLazyBillingPreviewSubscriptionUpdateV1Query,
  useBillingUpdateSubscriptionV1Mutation,
  useBillingGetCheckoutSessionV1Query,
  useLazyBillingGetCheckoutSessionV1Query,
} = injectedRtkApi
