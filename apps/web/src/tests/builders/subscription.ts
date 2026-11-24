import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { faker } from '@faker-js/faker'
import { Builder, type IBuilder } from '../Builder'

export function subscriptionBuilder(): IBuilder<Subscription> {
  const startAt = faker.date.recent().getTime()
  return Builder.new<Subscription>().with({
    id: `sub_${faker.string.alphanumeric(14)}`,
    customerId: `cus_${faker.string.alphanumeric(14)}`,
    upstreamCustomerId: faker.string.uuid(),
    plan: {
      id: `price_${faker.string.alphanumeric(14)}`,
      name: 'Business',
      currentPrice: 0,
      originalPrice: null,
      paymentMethod: 'card',
      currency: 'eur',
      features: [],
      billingCycle: 'month',
      type: 'recurring',
      product: `prod_${faker.string.alphanumeric(14)}`,
    },
    status: 'trialing',
    createdAt: startAt,
    startAt,
    cancelledAt: null,
    cancelAt: null,
  })
}
