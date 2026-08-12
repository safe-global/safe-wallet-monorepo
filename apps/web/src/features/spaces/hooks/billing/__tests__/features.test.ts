import type { PaymentLink, Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import {
  FREE_NUMBER_OF_SAFES,
  getNumberOfSafes,
  getPlanFeatures,
  getPlanName,
  getPlanPrice,
  getSubscriptionNumberOfSafes,
} from '../features'

const paymentLink = (overrides: Partial<PaymentLink> = {}): PaymentLink => ({
  id: 'pl_1',
  url: 'https://buy.stripe.com/test',
  active: true,
  metadata: {},
  lineItems: [],
  ...overrides,
})

const subscription = (metadata: Record<string, string>): Subscription => ({ metadata }) as unknown as Subscription

describe('billing/features', () => {
  describe('getNumberOfSafes', () => {
    it('reads FEATURE_NUMBER_OF_SAFES from metadata', () => {
      expect(getNumberOfSafes({ FEATURE_NUMBER_OF_SAFES: '25' })).toBe(25)
    })

    it('falls back to the free tier when the feature is missing', () => {
      expect(getNumberOfSafes({})).toBe(FREE_NUMBER_OF_SAFES)
    })

    it('falls back to the free tier when the value is unparseable', () => {
      expect(getNumberOfSafes({ FEATURE_NUMBER_OF_SAFES: 'lots' })).toBe(FREE_NUMBER_OF_SAFES)
    })

    it('handles non-object metadata safely', () => {
      expect(getNumberOfSafes(undefined)).toBe(FREE_NUMBER_OF_SAFES)
      expect(getNumberOfSafes(null)).toBe(FREE_NUMBER_OF_SAFES)
    })
  })

  describe('getSubscriptionNumberOfSafes', () => {
    it('returns the free tier when there is no subscription', () => {
      expect(getSubscriptionNumberOfSafes(undefined)).toBe(FREE_NUMBER_OF_SAFES)
    })

    it('returns the subscription allowance', () => {
      expect(getSubscriptionNumberOfSafes(subscription({ FEATURE_NUMBER_OF_SAFES: '50' }))).toBe(50)
    })
  })

  describe('getPlanFeatures', () => {
    it('maps FEATURE_NUMBER_OF_SAFES to a readable bullet', () => {
      expect(getPlanFeatures({ FEATURE_NUMBER_OF_SAFES: '10' })).toEqual(['Covers up to 10 Safe Accounts'])
    })

    it('singularises for a single Safe', () => {
      expect(getPlanFeatures({ FEATURE_NUMBER_OF_SAFES: '1' })).toEqual(['Covers up to 1 Safe Account'])
    })

    it('falls back to the provided list when no FEATURE_* keys exist', () => {
      expect(getPlanFeatures({ planName: 'Pro' }, ['Custom feature'])).toEqual(['Custom feature'])
    })
  })

  describe('getPlanName', () => {
    it('reads planName from metadata', () => {
      expect(getPlanName({ planName: 'Pro' })).toBe('Pro')
    })

    it('falls back to a generic label', () => {
      expect(getPlanName({})).toBe('Plan')
    })
  })

  describe('getPlanPrice', () => {
    it('sums lineItem unitAmounts (cents) into whole units', () => {
      const price = getPlanPrice(
        paymentLink({ lineItems: [{ price: { unitAmount: 4900, currency: 'usd' }, quantity: 1 }] }),
      )
      expect(price).toEqual({ amount: 49, symbol: '$', cycle: '/mo' })
    })

    it('multiplies unitAmount by quantity', () => {
      const price = getPlanPrice(
        paymentLink({ lineItems: [{ price: { unitAmount: 1000, currency: 'usd' }, quantity: 3 }] }),
      )
      expect(price?.amount).toBe(30)
    })

    it('reflects the currency symbol and yearly cycle', () => {
      const price = getPlanPrice(
        paymentLink({
          lineItems: [{ price: { unitAmount: 59900, currency: 'eur', recurring: { interval: 'year' } }, quantity: 1 }],
        }),
      )
      expect(price).toEqual({ amount: 599, symbol: '€', cycle: '/yr' })
    })

    it('returns undefined when no priced line item exists', () => {
      expect(getPlanPrice(paymentLink())).toBeUndefined()
    })
  })
})
