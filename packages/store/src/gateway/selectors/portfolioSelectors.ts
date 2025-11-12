import { cgwApi } from '../AUTO_GENERATED/portfolios'

export const selectPortfolioPositions = (state: any, address: string) => {
  const portfolioCache = cgwApi.endpoints.portfolioGetPortfolioV1.select({ address })(state)
  return portfolioCache?.data?.positionBalances
}
