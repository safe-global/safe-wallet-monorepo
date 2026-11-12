import { faker } from '@faker-js/faker'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Builder, type IBuilder } from '@/tests/Builder'
import { addressExBuilder } from '@/tests/builders/safe'

export const portfolioSummaryBuilder = (): IBuilder<PortfolioSummary> =>
  Builder.new<PortfolioSummary>().with({
    chainId: faker.string.numeric({ length: { min: 1, max: 6 } }),
    address: checksumAddress(faker.finance.ethereumAddress()),
    fiatTotal: faker.finance.amount(),
    source: 'zerion',
    snapshot: null,
  })

export const safeOverviewBuilder = (): IBuilder<SafeOverview> =>
  Builder.new<SafeOverview>().with({
    address: addressExBuilder().build(),
    chainId: faker.string.numeric({ length: { min: 1, max: 6 } }),
    threshold: faker.number.int({ min: 1, max: 5 }),
    owners: [addressExBuilder().build()],
    fiatTotal: faker.finance.amount(),
    queued: faker.number.int({ max: 10 }),
    awaitingConfirmation: null,
  })
