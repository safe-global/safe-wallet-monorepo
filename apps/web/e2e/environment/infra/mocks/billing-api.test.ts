import assert from 'node:assert/strict'
import { verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { Billing, PLANS, PRODUCT_ID, dispatch, es256Signer, serviceToken, subscriptionEvent } from './billing-api.ts'
import type { Subscription } from './billing-api.ts'

const BUSINESS_PRICE = PLANS.business.price.id
const STARTER_PRICE = PLANS.starter.price.id
const SPACE_UUID = '1f0e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b'
const CUSTOMER = SPACE_UUID.replaceAll('-', '')
const COMPOSE = readFileSync(new URL('../docker-compose.test.yml', import.meta.url), 'utf8')

type Payload = Record<string, unknown>

function recordingBilling(): { billing: Billing; announced: Subscription[] } {
  const announced: Subscription[] = []
  const billing = new Billing(async (subscription) => {
    announced.push(subscription)
  })
  return { billing, announced }
}

async function call(
  billing: Billing,
  method: string,
  path: string,
  body?: unknown,
  query = '',
): Promise<[number, Payload]> {
  const request = { method, path, query: new URLSearchParams(query), body: body ? JSON.stringify(body) : '' }
  const reply = await dispatch(request, billing)
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

  it('offers no payment links and serves both plans', async () => {
    const { billing } = recordingBilling()
    assert.deepEqual(await call(billing, 'GET', '/api/v1/payment-links'), [200, { paymentLinks: [] }])
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
