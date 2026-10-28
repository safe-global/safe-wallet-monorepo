import assert from 'node:assert/strict'
import { verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  Billing,
  PAYMENT_LINKS,
  PLANS,
  PRODUCT_ID,
  dispatch,
  es256Signer,
  serviceToken,
  subscriptionEvent,
} from './billing-api.ts'
import type { EventType, Subscription } from './billing-api.ts'
import type { Reply } from './http.ts'

const BUSINESS_PRICE = PLANS.business.price.id
const STARTER_PRICE = PLANS.starter.price.id
const SPACE_UUID = '1f0e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b'
const CUSTOMER = SPACE_UUID.replaceAll('-', '')
const COMPOSE = readFileSync(new URL('../docker-compose.test.yml', import.meta.url), 'utf8')

type Payload = Record<string, unknown>

type Recording = { billing: Billing; announced: Subscription[]; eventTypes: EventType[] }

function recordingBilling(publicUrl?: string): Recording {
  const announced: Subscription[] = []
  const eventTypes: EventType[] = []
  const billing = new Billing(async (subscription, eventType) => {
    announced.push(subscription)
    eventTypes.push(eventType)
  }, publicUrl)
  return { billing, announced, eventTypes }
}

function send(billing: Billing, method: string, path: string, body?: unknown, query = ''): Promise<Reply> {
  const request = { method, path, query: new URLSearchParams(query), body: body ? JSON.stringify(body) : '' }
  return dispatch(request, billing)
}

async function call(
  billing: Billing,
  method: string,
  path: string,
  body?: unknown,
  query = '',
): Promise<[number, Payload]> {
  const reply = await send(billing, method, path, body, query)
  return [reply.status, JSON.parse(reply.body) as Payload]
}

async function subscriptionsOf(billing: Billing, customer = CUSTOMER, query = ''): Promise<Subscription[]> {
  const [, payload] = await call(billing, 'GET', `/api/v1/customers/${customer}/subscriptions`, undefined, query)
  return payload.subscriptions as Subscription[]
}

function store(billing: Billing, overrides: unknown): Promise<[number, Payload]> {
  return call(billing, 'POST', `/__test/customers/${SPACE_UUID}/subscriptions`, overrides)
}

function decodeSegment(segment: string): Payload {
  return JSON.parse(Buffer.from(segment, 'base64url').toString()) as Payload
}

describe('billing API', () => {
  it('gives an unknown Workspace the Business trial and announces it', async () => {
    const { billing, announced } = recordingBilling()
    const [subscription] = await subscriptionsOf(billing)
    assert.equal(subscription.status, 'trialing')
    assert.equal(subscription.upstreamCustomerId, CUSTOMER)
    assert.equal(subscription.plan.id, BUSINESS_PRICE)
    assert.equal(subscription.metadata.planCode, 'BUS-20-M')
    assert.equal(subscription.metadata.customerGroup, 'wallet_web')
    assert.equal(JSON.parse(subscription.metadata.planDescriptions)[0], '50 sponsored transactions per month')
    assert.deepEqual(announced, [subscription])
  })

  it('answers the same plan on every read and announces it once', async () => {
    const { billing, announced } = recordingBilling()
    const first = await subscriptionsOf(billing)
    assert.deepEqual(await subscriptionsOf(billing), first)
    assert.deepEqual(await subscriptionsOf(billing, SPACE_UUID), first)
    assert.equal(announced.length, 1)
  })

  it('filters by status', async () => {
    const { billing } = recordingBilling()
    assert.equal((await subscriptionsOf(billing, CUSTOMER, 'status=trialing')).length, 1)
    assert.deepEqual(await subscriptionsOf(billing, CUSTOMER, 'status=canceled'), [])
  })

  it('announces a stored subscription before the call returns', async () => {
    const { billing, announced } = recordingBilling()
    const [status, stored] = await store(billing, { status: 'canceled', metadata: { FEATURE_SAFE_SEATS: '2' } })
    assert.equal(status, 200)
    assert.deepEqual(announced, [stored])
    assert.equal(stored.status, 'canceled')
    assert.equal((stored.metadata as Payload).FEATURE_SAFE_SEATS, '2')
    assert.deepEqual(await subscriptionsOf(billing), [stored])
    assert.equal(announced.length, 1)
  })

  it('lets a test store the Starter plan', async () => {
    const { billing } = recordingBilling()
    const [status, stored] = await store(billing, { plan: 'starter' })
    assert.equal(status, 200)
    assert.deepEqual([(stored.plan as Payload).id, (stored.plan as Payload).currentPrice], [STARTER_PRICE, 189])
    const metadata = stored.metadata as Payload
    assert.deepEqual([metadata.planName, metadata.FEATURE_POLICIES], ['Starter', 'false'])
  })

  it('rejects an unknown plan', async () => {
    const { billing } = recordingBilling()
    const [status, payload] = await store(billing, { plan: 'enterprise' })
    assert.equal(status, 400)
    assert.match(String(payload.message), /enterprise/)
    assert.equal((await subscriptionsOf(billing))[0].plan.id, BUSINESS_PRICE)
  })

  it('fails the stored subscription when the gateway refuses the webhook', async () => {
    const billing = new Billing(async () => {
      throw new Error('The gateway did not accept billing webhook')
    })
    await assert.rejects(store(billing, {}), /did not accept/)
  })

  it('serves both plans', async () => {
    const { billing } = recordingBilling()
    for (const [price, name] of [
      [BUSINESS_PRICE, 'Business'],
      [STARTER_PRICE, 'Starter'],
    ]) {
      const [status, plan] = await call(billing, 'GET', `/api/v1/plans/${price}`)
      const product = plan.product as Payload
      assert.deepEqual([status, plan.id, product.id, product.name], [200, price, PRODUCT_ID, name])
    }
    assert.equal((await call(billing, 'GET', '/api/v1/plans/other'))[0], 404)
  })

  it('offers each plan paid and as a trial for both sides of the enforcement date', async () => {
    const { billing } = recordingBilling()
    const [status, payload] = await call(billing, 'GET', '/api/v1/payment-links')
    assert.equal(status, 200)
    const links = payload.paymentLinks as typeof PAYMENT_LINKS
    const offers = links.map((link) => [link.metadata.planName, link.trialPeriodDays, link.metadata.gracePeriod])
    const expected = ['Business', 'Starter'].flatMap((name) => [
      [name, null, undefined],
      [name, 30, 'true'],
      [name, 30, 'false'],
    ])
    assert.deepEqual(offers, expected)
    for (const link of links) {
      const price = link.lineItems[0].price as { id: string; recurring: { interval: string } }
      assert.ok([BUSINESS_PRICE, STARTER_PRICE].includes(price.id))
      assert.equal(price.recurring.interval, 'month')
    }
  })

  it('offers no links negotiated for one customer', async () => {
    const { billing } = recordingBilling()
    const reply = await call(billing, 'GET', '/api/v1/payment-links', undefined, `customerId=${CUSTOMER}`)
    assert.deepEqual(reply, [200, { paymentLinks: [] }])
  })

  it('leaves a cleared Workspace without a plan and announces nothing', async () => {
    const { billing, announced } = recordingBilling()
    assert.equal((await call(billing, 'DELETE', `/__test/customers/${SPACE_UUID}/subscriptions`))[0], 200)
    assert.deepEqual(await subscriptionsOf(billing), [])
    assert.deepEqual(announced, [])
  })

  it('opens a local checkout page for the plan and the Workspace', async () => {
    const { billing } = recordingBilling('http://localhost:8010/billing')
    const body = { upstreamCustomerId: CUSTOMER, returnUrl: 'https://wallet.test/welcome/select-safes' }
    const [status, result] = await call(
      billing,
      'POST',
      '/api/v1/payment-links/plink_e2e_business_trial_grace/checkout',
      body,
    )
    assert.equal(status, 200)
    assert.equal(result.url, `http://localhost:8010/billing/checkout/${result.sessionId}`)
    const page = await send(billing, 'GET', `/checkout/${result.sessionId}`)
    assert.equal(page.status, 200)
    assert.equal(page.headers['Content-Type'], 'text/html; charset=utf-8')
    for (const line of [
      'Plan: Business',
      '30 days free',
      `Workspace: ${CUSTOMER}`,
      'Returns to: https://wallet.test/welcome/select-safes',
    ]) {
      assert.ok(page.body.includes(line), `the checkout page lacks ${line}`)
    }
  })

  it('escapes the return URL on the checkout page', async () => {
    const { billing } = recordingBilling()
    const body = { upstreamCustomerId: CUSTOMER, returnUrl: 'https://wallet.test/"><script>' }
    const [, result] = await call(billing, 'POST', '/api/v1/payment-links/plink_e2e_starter/checkout', body)
    const page = await send(billing, 'GET', `/checkout/${result.sessionId}`)
    assert.doesNotMatch(page.body, /<script/i)
  })

  it('rejects a checkout for an unknown link or session, or without its fields', async () => {
    const { billing } = recordingBilling()
    const body = { upstreamCustomerId: CUSTOMER, returnUrl: 'https://wallet.test' }
    assert.equal((await call(billing, 'POST', '/api/v1/payment-links/plink_other/checkout', body))[0], 404)
    assert.equal((await call(billing, 'GET', '/checkout/cs_other'))[0], 404)
    const incomplete = { upstreamCustomerId: CUSTOMER }
    assert.equal((await call(billing, 'POST', '/api/v1/payment-links/plink_e2e_starter/checkout', incomplete))[0], 400)
  })

  it('replaces the plan on a plan change and announces an update', async () => {
    const { billing, announced, eventTypes } = recordingBilling()
    const [subscription] = await subscriptionsOf(billing)
    const path = `/api/v1/customers/${CUSTOMER}/subscriptions/${subscription.id}`
    const [status, preview] = await call(billing, 'GET', `${path}/preview-update`, undefined, `planId=${STARTER_PRICE}`)
    assert.deepEqual([status, preview.amountDue, preview.currency], [200, 18_900, 'eur'])
    const change = { planId: STARTER_PRICE, paymentLinkId: 'plink_e2e_starter' }
    assert.deepEqual(await call(billing, 'PATCH', path, change), [
      200,
      { subscriptionId: subscription.id, success: true },
    ])
    const [changed] = await subscriptionsOf(billing)
    assert.deepEqual([changed.plan.id, changed.status], [STARTER_PRICE, subscription.status])
    assert.equal(eventTypes.at(-1), 'customer.subscription.updated')
    assert.deepEqual(announced.at(-1), changed)
  })

  it('rejects a plan change for an unknown subscription or plan', async () => {
    const { billing } = recordingBilling()
    const [subscription] = await subscriptionsOf(billing)
    const path = `/api/v1/customers/${CUSTOMER}/subscriptions`
    assert.equal((await call(billing, 'PATCH', `${path}/sub_other`, { planId: STARTER_PRICE }))[0], 404)
    assert.equal((await call(billing, 'PATCH', `${path}/${subscription.id}`, { planId: 'other' }))[0], 404)
    const preview = await call(billing, 'GET', `${path}/sub_other/preview-update`, undefined, `planId=${STARTER_PRICE}`)
    assert.equal(preview[0], 404)
  })

  it('names the event type in the webhook event and its ID', async () => {
    const { billing } = recordingBilling()
    const [subscription] = await subscriptionsOf(billing)
    const event = subscriptionEvent(subscription, 1, 'customer.subscription.updated')
    assert.equal(event.type, 'customer.subscription.updated')
    assert.match(String(event.id), /customer\.subscription\.updated$/)
  })

  it('rejects calls it cannot answer', async () => {
    const { billing } = recordingBilling()
    const [status, payload] = await call(billing, 'GET', `/api/v1/customers/${CUSTOMER}/session-url`)
    assert.equal(status, 404)
    assert.match(String(payload.message), /session-url/)
  })

  it('carries a complete wallet_web snapshot in the event', async () => {
    const { billing } = recordingBilling()
    const [subscription] = await subscriptionsOf(billing)
    const event = subscriptionEvent(subscription, 1_800_000_000)
    const data = event.data as Payload
    assert.equal(event.type, 'customer.subscription.created')
    assert.equal(event.created, 1_800_000_000)
    assert.deepEqual(data.customer, {
      customerGroup: 'wallet_web',
      upstreamCustomerId: CUSTOMER,
      customerId: subscription.customerId,
    })
    for (const key of ['subscriptionId', 'status', 'planId', 'currentPeriodStart', 'metadata']) {
      assert.notEqual(data[key], undefined)
    }
  })

  it('signs a service token that the gateway key verifies', () => {
    const signingKey = /BILLING_WEBHOOK_SIGNING_KEY: (\w+)/.exec(COMPOSE)?.[1]
    const pem = /-----BEGIN PUBLIC KEY-----[\s\S]*?-----END PUBLIC KEY-----/.exec(COMPOSE)?.[0]
    assert.ok(signingKey && pem, 'docker-compose.test.yml lacks the billing webhook keys')
    const token = serviceToken('safe-e2e-local', es256Signer(signingKey), 1_800_000_000)
    const [header, claims, signature] = token.split('.')
    assert.equal(decodeSegment(header).alg, 'ES256')
    assert.deepEqual(decodeSegment(claims), {
      iss: 'safe-e2e-local',
      sub: 'billing-service',
      aud: ['safe-e2e-local'],
      iat: 1_800_000_000,
      exp: 1_800_003_600,
      roles: ['SERVICE_ACCESS'],
    })
    const publicKey = pem.replace(/\n\s+/g, '\n')
    const valid = verify(
      'sha256',
      Buffer.from(`${header}.${claims}`),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(signature, 'base64url'),
    )
    assert.ok(valid)
  })
})
