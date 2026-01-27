export interface PositionsEndpointConfig {
  shouldUsePortfolioEndpoint: boolean
  shouldUsePositionsEndpoint: boolean
}

/**
 * Determines which endpoint to use for fetching positions data.
 * This is the single source of truth for endpoint selection logic across platforms.
 *
 * @param isPositionsEnabled - Whether the POSITIONS feature flag is enabled
 * @param isPortfolioEndpointEnabled - Whether the PORTFOLIO_ENDPOINT feature flag is enabled
 * @returns Configuration object indicating which endpoint to use
 */
export const getPositionsEndpointConfig = (
  isPositionsEnabled: boolean | undefined,
  isPortfolioEndpointEnabled: boolean | undefined,
): PositionsEndpointConfig => ({
  shouldUsePortfolioEndpoint: !!isPositionsEnabled && !!isPortfolioEndpointEnabled,
  shouldUsePositionsEndpoint: !!isPositionsEnabled && !isPortfolioEndpointEnabled,
})
