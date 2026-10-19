/**
 * Answers the gateway's billing service calls (SAFE_BILLING_SERVICE_BASE_URI) in place of the hosted service.
 *
 * Every Workspace holds a Business trial, as on staging, unless a test stores another subscription through
 * POST /__test/customers/{id}/subscriptions (body: optional "plan" business|starter, "status", "metadata").
 * Like the real service, the mock announces each subscription to the gateway with a signed webhook, which is
 * what writes the Workspace's entitlements.
 */
import { createECDH, createPrivateKey, sign } from 'node:crypto'
import { isMain, json, postJson, requiredEnv, serve } from './http.ts'
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
const TEST_CUSTOMER_PATH = /^\/__test\/customers\/([0-9a-fA-F-]+)\/subscriptions$/
const PLAN_PATH = /^\/api\/v1\/plans\/([^/]+)$/

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

export type Announce = (subscription: Subscription) => Promise<void>

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

export function subscriptionEvent(subscription: Subscription, created: number): Record<string, unknown> {
  return {
    id: `evt_e2e_${subscription.upstreamCustomerId}_${created}`,
    type: 'customer.subscription.created',
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

/** Subscriptions by customer, and the webhook that announces them to the gateway. */
export class Billing {
  private readonly subscriptions = new Map<string, Subscription[]>()
  private readonly announce: Announce

  constructor(announce: Announce) {
    this.announce = announce
  }

  listSubscriptions(customer: string): Subscription[] {
    const stored = this.subscriptions.get(customer)
    if (stored) return [...stored]
    const subscription = defaultSubscription(customer)
    this.subscriptions.set(customer, [subscription])
    this.announce(subscription).catch((error: unknown) => console.error(error))
    return [subscription]
  }

  async store(customer: string, overrides: Overrides): Promise<Subscription> {
    const subscription = defaultSubscription(customer, overrides)
    this.subscriptions.set(customer, [subscription])
    await this.announce(subscription)
    return subscription
  }
}

function plan(priceId: string): Reply {
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

async function storeSubscription(billing: Billing, customer: string, body: string): Promise<Reply> {
  try {
    return json(200, await billing.store(customerKey(customer), body ? (JSON.parse(body) as Overrides) : {}))
  } catch (error) {
    if (error instanceof UnknownPlan) return json(400, { message: error.message })
    throw error
  }
}

export async function dispatch(
  { method, path, query, body }: Pick<MockRequest, 'method' | 'path' | 'query' | 'body'>,
  billing: Billing,
): Promise<Reply> {
  if (method === 'GET' && path === '/health') return json(200, { ready: true })
  const customer = CUSTOMER_PATH.exec(path)
  if (method === 'GET' && customer) {
    const status = query.get('status') ?? 'all'
    const subscriptions = billing.listSubscriptions(customerKey(customer[1]))
    return json(200, { subscriptions: subscriptions.filter((s) => status === 'all' || s.status === status) })
  }
  if (method === 'GET' && path === '/api/v1/payment-links') return json(200, { paymentLinks: [] })
  const planMatch = PLAN_PATH.exec(path)
  if (method === 'GET' && planMatch) return plan(planMatch[1])
  const testCustomer = TEST_CUSTOMER_PATH.exec(path)
  if (method === 'POST' && testCustomer) return storeSubscription(billing, testCustomer[1], body)
  return json(404, { message: `The local billing service does not support ${method} ${path}` })
}

function announcer(webhookUrl: string, issuer: string, signer: Signer): Announce {
  return async (subscription) => {
    const now = Math.floor(Date.now() / 1000)
    const event = subscriptionEvent(subscription, now)
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
  const billing = new Billing(
    announcer(requiredEnv('BILLING_WEBHOOK_URL'), requiredEnv('BILLING_WEBHOOK_JWT_ISSUER'), signer),
  )
  serve(PORT, async (request) => {
    try {
      return await dispatch(request, billing)
    } catch (error) {
      return json(502, { message: error instanceof Error ? error.message : String(error) })
    }
  })
}
