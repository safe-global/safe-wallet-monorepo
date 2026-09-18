import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Builder, type IBuilder } from '@/tests/Builder'
import { buildSafeAccountId } from '../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import type { LimitSummary, LimitSummaryToken, SpendingLimitSummaryModel, SpenderSummary } from './types'

// Test-only data factories.
const fakeAddress = (): string => checksumAddress(faker.finance.ethereumAddress())

const PRODUCTION_PERIODS = ['0', '1440', '10080', '43200']

export const limitSummaryTokenBuilder = (): IBuilder<LimitSummaryToken> =>
  Builder.new<LimitSummaryToken>().with({
    address: fakeAddress(),
    symbol: faker.finance.currencyCode(),
    decimals: 18,
    logoUri: faker.image.url(),
  })

export const limitSummaryBuilder = (): IBuilder<LimitSummary> =>
  Builder.new<LimitSummary>().with({
    token: limitSummaryTokenBuilder().build(),
    amount: faker.number.float({ min: 0.0001, max: 1000, fractionDigits: 4 }).toString(),
    resetTimeMin: faker.helpers.arrayElement(PRODUCTION_PERIODS),
  })

export const spenderSummaryBuilder = (): IBuilder<SpenderSummary> =>
  Builder.new<SpenderSummary>().with({
    address: fakeAddress(),
    name: faker.person.firstName(),
    limits: [limitSummaryBuilder().build()],
  })

export const safeAccountOptionBuilder = (): IBuilder<SafeAccountOption> => {
  const chainId = '1'
  const address = fakeAddress()
  return Builder.new<SafeAccountOption>().with({
    id: buildSafeAccountId(chainId, address),
    chainId,
    address,
    name: faker.company.name(),
    threshold: 3,
    owners: 5,
    eligibility: 'signer',
    chain: { chainId, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
    fiatTotal: faker.finance.amount({ min: 0, max: 1_000_000, dec: 2 }),
  })
}

export const spendingLimitSummaryBuilder = (): IBuilder<SpendingLimitSummaryModel> =>
  Builder.new<SpendingLimitSummaryModel>().with({
    safe: safeAccountOptionBuilder().build(),
    spenders: [spenderSummaryBuilder().build()],
  })
