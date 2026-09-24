import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '@/features/spending-limits'
import { Builder, type IBuilder } from '@/tests/Builder'

const PRODUCTION_PERIODS = ['0', '1440', '10080', '43200']

export const spendingLimitStateBuilder = (): IBuilder<SpendingLimitState> =>
  Builder.new<SpendingLimitState>().with({
    beneficiary: checksumAddress(faker.finance.ethereumAddress()),
    token: {
      address: checksumAddress(faker.finance.ethereumAddress()),
      symbol: faker.finance.currencyCode(),
      decimals: 18,
      logoUri: faker.image.url(),
    },
    amount: faker.number.int({ min: 1, max: 1_000_000 }).toString(),
    spent: '0',
    nonce: '1',
    resetTimeMin: faker.helpers.arrayElement(PRODUCTION_PERIODS),
    lastResetMin: String(faker.number.int({ min: 1, max: 30_000_000 })),
  })
