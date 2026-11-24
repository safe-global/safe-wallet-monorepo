import { faker } from '@faker-js/faker'
import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { Builder, type IBuilder } from '../Builder'

type TrialLinkOptions = { planName?: string; seats?: number; trialPeriodDays?: number }

/** A monthly trial payment link as `GET /v1/billing/trial-plans` returns it. */
export function trialPaymentLinkBuilder({
  planName = faker.commerce.productName(),
  seats = faker.number.int({ min: 1, max: 50 }),
  trialPeriodDays = faker.number.int({ min: 7, max: 60 }),
}: TrialLinkOptions = {}): IBuilder<PaymentLink> {
  return Builder.new<PaymentLink>().with({
    id: `plink_${faker.string.alphanumeric(14)}`,
    active: true,
    metadata: { planName, FEATURE_SAFE_SEATS: String(seats), planSubtitle: faker.lorem.sentence() },
    lineItems: [
      {
        price: {
          id: `price_${faker.string.alphanumeric(14)}`,
          unitAmount: faker.number.int({ min: 1_000, max: 200_000 }),
          currency: 'eur',
          recurring: { interval: 'month' },
        },
      },
    ],
    trialPeriodDays,
  })
}
