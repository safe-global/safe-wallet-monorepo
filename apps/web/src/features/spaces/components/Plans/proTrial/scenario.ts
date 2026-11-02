import { http, HttpResponse } from 'msw'
import type { PaymentLink, Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { createMockSpace, mockSafeOverviews } from '@/stories/mocks/handlers'
import { DAY, PAID_LINKS, TRIAL_LINKS, now, subscription } from '../plans.fixtures'
import { recommendSeats } from './recommendPlan'

export type PlanState = 'pre-trial' | 'trial' | 'trial-3' | 'trial-last' | 'ended' | 'paid'
export type Region = 'eu' | 'us'

export type ProTrialScenario = { plan: PlanState; safes: number; region: Region }

export const PLAN_STATES: PlanState[] = ['pre-trial', 'trial', 'trial-3', 'trial-last', 'ended', 'paid']
export const SAFE_COUNTS = [1, 4, 12, 25]

// Mock conversion so US stories show dollars; Stripe sets the real USD prices.
const USD_PER_EUR = 1.162

type LineItem = { price: { id: string; unitAmount: number; currency: string } }

const lineItemsOf = (link: PaymentLink): LineItem[] =>
  Array.isArray(link.lineItems) ? (link.lineItems as LineItem[]) : []

const inRegion = (link: PaymentLink, region: Region): PaymentLink =>
  region === 'eu'
    ? link
    : {
        ...link,
        lineItems: lineItemsOf(link).map((item) => ({
          ...item,
          price: { ...item.price, currency: 'usd', unitAmount: Math.round(item.price.unitAmount * USD_PER_EUR) },
        })),
      }

const SECONDS_LEFT: Record<'trial' | 'trial-3' | 'trial-last', number> = {
  trial: 30 * DAY,
  'trial-3': 3 * DAY,
  'trial-last': DAY / 2,
}

/** The Workspace's subscriptions in each plan state. Trials are on Business 20, as every trial is today. */
const subscriptionsFor = ({ plan, safes, region }: ProTrialScenario): Subscription[] => {
  const currency = region === 'us' ? 'usd' : 'eur'
  const base = subscription()
  const withCurrency = (sub: Subscription): Subscription => ({ ...sub, plan: { ...sub.plan, currency } })

  switch (plan) {
    case 'pre-trial':
      return []
    case 'ended':
      return [
        withCurrency(subscription({ status: 'canceled', currentPeriodEnd: now() - DAY, cancelledAt: now() - DAY })),
      ]
    case 'paid': {
      const seats = recommendSeats(safes)
      const link = PAID_LINKS.find((candidate) => candidate.id === `pl_Business_${seats}_month`)
      const [price] = lineItemsOf(inRegion(link ?? PAID_LINKS[0], region))
      return [
        withCurrency(
          subscription({
            status: 'active',
            hasPaymentMethod: true,
            currentPeriodEnd: now() + 20 * DAY,
            metadata: { ...base.metadata, FEATURE_SAFE_SEATS: String(seats) },
            plan: { ...base.plan, id: `price_Business_${seats}_month`, currentPrice: price.price.unitAmount / 100 },
          }),
        ),
      ]
    }
    default:
      return [withCurrency(subscription({ currentPeriodEnd: now() + SECONDS_LEFT[plan] }))]
  }
}

/** Made-up Safes on Ethereum; sequential placeholder addresses, not real accounts. */
const mockSafes = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const template = mockSafeOverviews[index % mockSafeOverviews.length]
    return {
      ...template,
      chainId: '1',
      address: { value: `0x${(index + 1).toString(16).padStart(40, '0')}`, name: null, logoUri: null },
      fiatTotal: String(12_000 + ((index * 7919) % 90) * 1_000),
    }
  })

/** MSW handlers for one scenario: billing, entitlements and a Workspace with `safes` Safes. */
export const scenarioHandlers = (scenario: ProTrialScenario) => {
  // The prototype's "start trial" endpoint turns a pre-trial Workspace into a fresh trial for the rest of the story.
  let hasStartedTrial = false
  const current = (): ProTrialScenario => (hasStartedTrial ? { ...scenario, plan: 'trial' } : scenario)
  const subscriptions = () => subscriptionsFor(current())
  const links = () =>
    (current().plan === 'pre-trial' ? TRIAL_LINKS : PAID_LINKS).map((link) => inRegion(link, scenario.region))
  const live = () => subscriptions().find((sub) => sub.status === 'trialing' || sub.status === 'active')
  const seatsQuota = scenario.plan === 'paid' ? recommendSeats(scenario.safes) : 20
  const safes = mockSafes(scenario.safes)

  return [
    http.post(/\/v1\/billing\/spaces\/[^/]+\/trial$/, async () => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      hasStartedTrial = true
      return HttpResponse.json({ status: 'trialing' })
    }),
    http.get(/\/v1\/billing\/spaces\/[^/]+\/subscriptions/, () => HttpResponse.json(subscriptions())),
    http.get(/\/v1\/billing\/spaces\/[^/]+\/payment-links$/, () => HttpResponse.json(links())),
    // Stripe Checkout is mocked: the hand-off "navigates" to a hash, so the story stays on its step.
    http.get(/\/v1\/billing\/spaces\/[^/]+\/payment-links\/[^/]+\/checkout-url$/, () =>
      HttpResponse.json({ url: '#mock-stripe-checkout' }),
    ),
    http.get(/\/v1\/spaces\/[^/]+\/entitlements$/, () => {
      const plan = live()
      return HttpResponse.json({
        plan: plan
          ? {
              id: plan.plan.id,
              name: plan.plan.name,
              cycleEndsAt: new Date((plan.currentPeriodEnd ?? now()) * 1000).toISOString(),
              status: plan.status === 'trialing' ? 'trialing' : 'active',
            }
          : null,
        entitlements: plan
          ? [
              {
                feature: 'safe_seats',
                enabled: true,
                type: 'metered',
                quota: seatsQuota,
                used: scenario.safes,
                resetsAt: null,
              },
              {
                feature: 'sponsored_transactions',
                enabled: true,
                type: 'metered',
                quota: 50,
                used: 12,
                resetsAt: null,
              },
            ]
          : [],
      })
    }),
    http.get(/\/v1\/spaces$/, () => HttpResponse.json([{ ...createMockSpace(), safeCount: scenario.safes }])),
    http.get(/\/v1\/spaces\/[^/]+\/safes$/, () =>
      HttpResponse.json({ safes: { '1': safes.map((safe) => safe.address.value) } }),
    ),
    http.get(/\/v[12]\/safes$/, () => HttpResponse.json(safes)),
  ]
}
