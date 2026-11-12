import { faker } from '@faker-js/faker'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Builder, type IBuilder } from '@/tests/Builder'

export const portfolioSummaryBuilder = (): IBuilder<PortfolioSummary> =>
  Builder.new<PortfolioSummary>().with({
    chainId: faker.string.numeric({ length: { min: 1, max: 6 } }),
    address: checksumAddress(faker.finance.ethereumAddress()),
    fiatTotal: faker.finance.amount(),
    source: 'zerion',
    snapshot: null,
  })
