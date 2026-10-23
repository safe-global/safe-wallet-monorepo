/**
 * Answers the gateway's billing service calls (SAFE_BILLING_SERVICE_BASE_URI) in place of the hosted service.
 *
 * Every Workspace holds a Business trial, as on staging, unless a test stores another subscription through
 * POST /__test/customers/{id}/subscriptions (body: optional "plan" business|starter, "status", "metadata"), or
 * leaves a new Workspace without one, as in production, through DELETE /__test/customers/{id}/subscriptions.
 * Like the real service, the mock announces each subscription to the gateway with a signed webhook, which is
 * what writes the Workspace's entitlements. A checkout opens a local page in place of Stripe's.
 */
import { createECDH, createPrivateKey, sign } from 'node:crypto'
import { escapeHtml, html, isMain, json, postJson, requiredEnv, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'
import { base64url, signJwt } from './jwt.ts'
import type { Signer } from './jwt.ts'

export const PRODUCT_ID = 'prod_UwFCHLTTR3EAkt'
const PERIOD_START = 1767225600 // 2026-01-01T00:00:00Z
const PERIOD_END = 4102444800 // 2100-01-01T00:00:00Z
const CUSTOMER_GROUP = 'wallet_web'
const SERVICE_ACCESS_ROLE = 'SERVICE_ACCESS'
const TOKEN_LIFETIME_SECONDS = 3600
const WEBHOOK_ATTEMPTS = 5
const WEBHOOK_TIMEOUT_MS = 30_000
const DEFAULT_PLAN = 'business'
const TRIAL_PERIOD_DAYS = 30
const PORT = 8093

type Plan = { price: { id: string; currentPrice: number }; metadata: Record<string, string> }

// Copied from staging Workspace subscriptions.
export const PLANS: Record<string, Plan> = {
  business: {
    price: { id: 'price_1ULiB9PDjZa9uJScGuwyKa6V', currentPrice: 1669 },
    metadata: {
      FEATURE_COPILOT_SCANS: 'true',
      FEATURE_POLICIES: 'true',
      FEATURE_SAFE_SEATS: '20',
      FEATURE_SPONSORED_TRANSACTIONS: '50',
      planCode: 'BUS-20-M',
      planDescriptions: JSON.stringify([
        '50 sponsored transactions per month',
        'Shared address book',
        'Activity log',
        'Advanced threat analysis',
        'Transaction simulation',
        'MFA authentication',
        'Policy engine',
        'Transaction proposers',
        'Priority support + guided onboarding',
      ]),
      planName: 'Business',
      planType: 'wallet-trial',
    },
  },
  starter: {
    price: { id: 'price_1ULiDIPDjZa9uJScut0wtEzS', currentPrice: 189 },
    metadata: {
      FEATURE_COPILOT_SCANS: 'true',
      FEATURE_POLICIES: 'false',
      FEATURE_SAFE_SEATS: '2',
      FEATURE_SPONSORED_TRANSACTIONS: '10',
      planCode: 'STA-2-M',
      planDescriptions: JSON.stringify([
        '10 sponsored transactions per month',
        'Shared address book',
        'Activity log',
        'Advanced threat analysis',
        'Transaction simulation',
        'Standard support (in-app and email)',
      ]),
      planName: 'Starter',
      planType: 'wallet-global',
    },
  },
}

const CUSTOMER_PATH = /^\/api\/v1\/customers\/([0-9a-fA-F-]+)\/subscriptions$/
const SUBSCRIPTION_PATH = /^\/api\/v1\/customers\/([0-9a-fA-F-]+)\/subscriptions\/([^/]+)$/
const PREVIEW_PATH = /^\/api\/v1\/customers\/([0-9a-fA-F-]+)\/subscriptions\/([^/]+)\/preview-update$/
const TEST_CUSTOMER_PATH = /^\/__test\/customers\/([0-9a-fA-F-]+)\/subscriptions$/
const PLAN_PATH = /^\/api\/v1\/plans\/([^/]+)$/
const CHECKOUT_PATH = /^\/api\/v1\/payment-links\/([^/]+)\/checkout$/
const CHECKOUT_PAGE_PATH = /^\/checkout\/([^/]+)$/

export type Subscription = {
  id: string
  customerId: string
  upstreamCustomerId: string
  plan: { id: string; product: string } & Record<string, unknown>
  status: string
  currentPeriodStart: number
  currentPeriodEnd: number
  metadata: Record<string, string>
} & Record<string, unknown>

type Overrides = { plan?: string; status?: string; metadata?: Record<string, string> }

export type EventType = 'customer.subscription.created' | 'customer.subscription.updated'
export type Announce = (subscription: Subscription, eventType: EventType) => Promise<void>

type TrialSide = 'grace' | 'new'

export type PaymentLink = {
  id: string
  active: boolean
  metadata: Record<string, string>
  lineItems: { price: Record<string, unknown>; quantity: number }[]
  trialPeriodDays: number | null
}

type CheckoutSession = { id: string; paymentLinkId: string; upstreamCustomerId: string; returnUrl: string }

class UnknownPlan extends Error {}

function planPrice(plan: string): Plan['price'] & Record<string, unknown> {
  return {
    ...PLANS[plan].price,
    originalPrice: null,
    paymentMethod: 'fiat',
    currency: 'eur',
    features: [],
    billingCycle: 'month',
    type: 'standard',
  }
}

function planOfPrice(priceId: string): string | undefined {
  return Object.keys(PLANS).find((plan) => PLANS[plan].price.id === priceId)
}

/** A plan of the general catalog; a trial link carries the `gracePeriod` side of the enforcement date it serves. */
function paymentLink(plan: string, trialSide?: TrialSide): PaymentLink {
  const { price, metadata } = PLANS[plan]
  const link: PaymentLink = {
    id: `plink_e2e_${plan}`,
    active: true,
    metadata,
    lineItems: [
      {
        price: {
          id: price.id,
          unitAmount: price.currentPrice * 100,
          currency: 'eur',
          recurring: { interval: 'month', intervalCount: 1 },
        },
        quantity: 1,
      },
    ],
    trialPeriodDays: null,
  }
  if (trialSide === undefined) return link
  return {
    ...link,
    id: `plink_e2e_${plan}_trial_${trialSide}`,
    metadata: { ...metadata, gracePeriod: trialSide === 'grace' ? 'true' : 'false' },
    trialPeriodDays: TRIAL_PERIOD_DAYS,
  }
}

// Both trial sides: the gateway offers the grace trial to Workspaces created before ENTITLEMENTS_ENFORCEMENT_STARTS_AT.
export const PAYMENT_LINKS = Object.keys(PLANS).flatMap((plan) => [
  paymentLink(plan),
  paymentLink(plan, 'grace'),
  paymentLink(plan, 'new'),
])

/** The gateway sends Space UUIDs without dashes; tests may send them with. */
function customerKey(customerId: string): string {
  return customerId.replaceAll('-', '').toLowerCase()
}

function defaultSubscription(customer: string, overrides: Overrides = {}): Subscription {
  const plan = overrides.plan ?? DEFAULT_PLAN
  if (!(plan in PLANS)) throw new UnknownPlan(`Unknown plan '${plan}'; use one of ${Object.keys(PLANS).sort()}`)
  return {
    id: `sub_e2e_${customer}`,
    customerId: `cus_e2e_${customer}`,
    upstreamCustomerId: customer,
    plan: { ...planPrice(plan), product: PRODUCT_ID },
    status: overrides.status ?? 'trialing',
    createdAt: PERIOD_START,
    startAt: PERIOD_START,
    cancelledAt: null,
    cancelAt: null,
    currentPeriodStart: PERIOD_START,
    currentPeriodEnd: PERIOD_END,
    metadata: {
      ...PLANS[plan].metadata,
      customerGroup: CUSTOMER_GROUP,
      gracePeriod: 'true',
      ...overrides.metadata,
    },
    hasPaymentMethod: false,
  }
}

export function subscriptionEvent(
  subscription: Subscription,
  created: number,
  eventType: EventType = 'customer.subscription.created',
): Record<string, unknown> {
  return {
    id: `evt_e2e_${subscription.upstreamCustomerId}_${created}_${eventType}`,
    type: eventType,
    created,
    data: {
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.plan.id,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      metadata: subscription.metadata,
      customer: {
        customerGroup: CUSTOMER_GROUP,
        upstreamCustomerId: subscription.upstreamCustomerId,
        customerId: subscription.customerId,
      },
    },
  }
}

/** Signs with the P-256 test key, given as its private scalar in hex. */
export function es256Signer(privateKeyHex: string): Signer {
  const ecdh = createECDH('prime256v1')
  ecdh.setPrivateKey(Buffer.from(privateKeyHex, 'hex'))
  const publicKey = ecdh.getPublicKey()
  const key = createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: base64url(Buffer.from(privateKeyHex, 'hex')),
      x: base64url(publicKey.subarray(1, 33)),
      y: base64url(publicKey.subarray(33)),
    },
  })
  return (message) => sign('sha256', message, { key, dsaEncoding: 'ieee-p1363' })
}

/** The service token the gateway's BillingWebhookAuthGuard accepts (iss = aud = its own issuer). */
export function serviceToken(issuer: string, signer: Signer, now: number): string {
  const claims = {
    iss: issuer,
    sub: 'billing-service',
    aud: [issuer],
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
    roles: [SERVICE_ACCESS_ROLE],
  }
  return signJwt({ alg: 'ES256', typ: 'JWT' }, claims, signer)
}

/** Subscriptions and checkouts by customer, and the webhook that announces subscriptions to the gateway. */
export class Billing {
  private readonly subscriptions = new Map<string, Subscription[]>()
  private readonly sessions = new Map<string, CheckoutSession>()
  private readonly announce: Announce
  private readonly publicUrl: string

  constructor(announce: Announce, publicUrl = 'http://localhost:8000/billing') {
    this.announce = announce
    this.publicUrl = publicUrl
  }

  listSubscriptions(customer: string): Subscription[] {
    const stored = this.subscriptions.get(customer)
    if (stored) return [...stored]
    const subscription = defaultSubscription(customer)
    this.subscriptions.set(customer, [subscription])
    this.announce(subscription, 'customer.subscription.created').catch((error: unknown) => console.error(error))
    return [subscription]
  }

  async store(customer: string, overrides: Overrides): Promise<Subscription> {
    const subscription = defaultSubscription(customer, overrides)
    this.subscriptions.set(customer, [subscription])
    await this.announce(subscription, 'customer.subscription.created')
    return subscription
  }

  /** A Workspace the gateway has not read yet starts without a plan, as in production. */
  clear(customer: string): void {
    this.subscriptions.set(customer, [])
  }

  find(customer: string, subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(customer)?.find((subscription) => subscription.id === subscriptionId)
  }

  async changePlan(customer: string, subscriptionId: string, plan: string): Promise<Subscription | undefined> {
    const current = this.find(customer, subscriptionId)
    if (current === undefined) return undefined
    const changed = defaultSubscription(customer, { plan, status: current.status })
    this.subscriptions.set(customer, [changed])
    await this.announce(changed, 'customer.subscription.updated')
    return changed
  }

  checkout(paymentLinkId: string, customer: string, returnUrl: string): { sessionId: string; url: string } {
    const sessionId = `cs_e2e_${this.sessions.size + 1}`
    this.sessions.set(sessionId, { id: sessionId, paymentLinkId, upstreamCustomerId: customer, returnUrl })
    return { sessionId, url: `${this.publicUrl}/checkout/${sessionId}` }
  }

  checkoutSession(sessionId: string): CheckoutSession | undefined {
    return this.sessions.get(sessionId)
  }
}

type BillingRequest = Pick<MockRequest, 'method' | 'path' | 'query' | 'body'>
type Route = {
  method: string
  path: RegExp
  handle: (params: string[], request: BillingRequest, billing: Billing) => Reply | Promise<Reply>
}

const UNKNOWN_SUBSCRIPTION_OR_PLAN = json(404, { message: 'Unknown subscription or plan' })

function parseBody<T>(body: string): Partial<T> {
  return body ? (JSON.parse(body) as Partial<T>) : {}
}

function plan([priceId]: string[]): Reply {
  const name = planOfPrice(priceId)
  if (!name) return json(404, { message: `Unknown plan ${priceId}` })
  const product = {
    id: PRODUCT_ID,
    active: true,
    description: 'Safe Pro',
    marketingFeatures: [],
    metadata: {},
    name: PLANS[name].metadata.planName,
  }
  return json(200, { ...planPrice(name), product })
}

function listSubscriptions([customer]: string[], { query }: BillingRequest, billing: Billing): Reply {
  const status = query.get('status') ?? 'all'
  const subscriptions = billing.listSubscriptions(customerKey(customer))
  return json(200, { subscriptions: subscriptions.filter((s) => status === 'all' || s.status === status) })
}

async function storeSubscription([customer]: string[], { body }: BillingRequest, billing: Billing): Promise<Reply> {
  try {
    return json(200, await billing.store(customerKey(customer), parseBody<Overrides>(body)))
  } catch (error) {
    if (error instanceof UnknownPlan) return json(400, { message: error.message })
    throw error
  }
}

function checkout([linkId]: string[], { body }: BillingRequest, billing: Billing): Reply {
  if (!PAYMENT_LINKS.some((link) => link.id === linkId)) return json(404, { message: `Unknown payment link ${linkId}` })
  const { upstreamCustomerId, returnUrl } = parseBody<{ upstreamCustomerId: string; returnUrl: string }>(body)
  if (!upstreamCustomerId || !returnUrl)
    return json(400, { message: 'A checkout needs upstreamCustomerId and returnUrl' })
  return json(200, billing.checkout(linkId, customerKey(upstreamCustomerId), returnUrl))
}

function checkoutPage([sessionId]: string[], _request: BillingRequest, billing: Billing): Reply {
  const session = billing.checkoutSession(sessionId)
  const link = PAYMENT_LINKS.find((candidate) => candidate.id === session?.paymentLinkId)
  if (!session || !link) return json(404, { message: 'Unknown checkout session' })
  const trial = link.trialPeriodDays ? `<p>${link.trialPeriodDays} days free</p>` : ''
  return html(
    200,
    `<!doctype html><html><head><title>Local checkout</title></head><body>
<h1>Local checkout</h1>
<p>Plan: ${escapeHtml(link.metadata.planName)}</p>${trial}
<p>Workspace: ${escapeHtml(session.upstreamCustomerId)}</p>
<p>Returns to: ${escapeHtml(session.returnUrl)}</p>
</body></html>`,
  )
}

function previewPlanChange([customer, subscriptionId]: string[], { query }: BillingRequest, billing: Billing): Reply {
  const name = planOfPrice(query.get('planId') ?? '')
  if (!name || !billing.find(customerKey(customer), subscriptionId)) return UNKNOWN_SUBSCRIPTION_OR_PLAN
  const amount = PLANS[name].price.currentPrice * 100
  const item = { description: `Remaining time on ${PLANS[name].metadata.planName}`, amount, currency: 'eur' }
  return json(200, { amountDue: amount, currency: 'eur', nextBillingDate: PERIOD_END, lineItems: [item] })
}

async function changePlan(
  [customer, subscriptionId]: string[],
  { body }: BillingRequest,
  billing: Billing,
): Promise<Reply> {
  const name = planOfPrice(parseBody<{ planId: string }>(body).planId ?? '')
  const changed = name && (await billing.changePlan(customerKey(customer), subscriptionId, name))
  if (!changed) return UNKNOWN_SUBSCRIPTION_OR_PLAN
  return json(200, { subscriptionId: changed.id, success: true })
}

const ROUTES: Route[] = [
  { method: 'GET', path: /^\/health$/, handle: () => json(200, { ready: true }) },
  { method: 'GET', path: CUSTOMER_PATH, handle: listSubscriptions },
  {
    method: 'GET',
    path: /^\/api\/v1\/payment-links$/,
    // Links negotiated for one customer: none here.
    handle: (_params, { query }) => json(200, { paymentLinks: query.has('customerId') ? [] : PAYMENT_LINKS }),
  },
  { method: 'POST', path: CHECKOUT_PATH, handle: checkout },
  { method: 'GET', path: CHECKOUT_PAGE_PATH, handle: checkoutPage },
  { method: 'GET', path: PREVIEW_PATH, handle: previewPlanChange },
  { method: 'PATCH', path: SUBSCRIPTION_PATH, handle: changePlan },
  { method: 'GET', path: PLAN_PATH, handle: plan },
  { method: 'POST', path: TEST_CUSTOMER_PATH, handle: storeSubscription },
  {
    method: 'DELETE',
    path: TEST_CUSTOMER_PATH,
    handle: ([customer], _request, billing) => {
      billing.clear(customerKey(customer))
      return json(200, { subscriptions: [] })
    },
  },
]

export async function dispatch(request: BillingRequest, billing: Billing): Promise<Reply> {
  for (const route of ROUTES) {
    const match = route.method === request.method ? route.path.exec(request.path) : null
    if (match) return route.handle(match.slice(1), request, billing)
  }
  return json(404, { message: `The local billing service does not support ${request.method} ${request.path}` })
}

function announcer(webhookUrl: string, issuer: string, signer: Signer): Announce {
  return async (subscription, eventType) => {
    const now = Math.floor(Date.now() / 1000)
    const event = subscriptionEvent(subscription, now, eventType)
    for (let attempt = 1; attempt <= WEBHOOK_ATTEMPTS; attempt++) {
      try {
        const authorization = `Bearer ${serviceToken(issuer, signer, now)}`
        await postJson(webhookUrl, event, WEBHOOK_TIMEOUT_MS, { Authorization: authorization })
        return
      } catch (error) {
        console.error(`Billing webhook ${event.id} attempt ${attempt} failed: ${error}`)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
      }
    }
    throw new Error(`The gateway did not accept billing webhook ${event.id}`)
  }
}

if (isMain(import.meta.url)) {
  const signer = es256Signer(requiredEnv('BILLING_WEBHOOK_SIGNING_KEY'))
  const announce = announcer(requiredEnv('BILLING_WEBHOOK_URL'), requiredEnv('BILLING_WEBHOOK_JWT_ISSUER'), signer)
  const billing = new Billing(announce, requiredEnv('BILLING_PUBLIC_URL'))
  serve(PORT, async (request) => {
    try {
      return await dispatch(request, billing)
    } catch (error) {
      return json(502, { message: error instanceof Error ? error.message : String(error) })
    }
  })
}
