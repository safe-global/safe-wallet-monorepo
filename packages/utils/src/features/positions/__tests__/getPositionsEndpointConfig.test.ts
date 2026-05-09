import { getPositionsEndpointConfig } from '../utils/getPositionsEndpointConfig'

describe('getPositionsEndpointConfig', () => {
  it('returns both false when positions feature is disabled', () => {
    const result = getPositionsEndpointConfig(false, true)
    expect(result.shouldUsePortfolioEndpoint).toBe(false)
    expect(result.shouldUsePositionsEndpoint).toBe(false)
  })

  it('returns both false when positions feature is undefined', () => {
    const result = getPositionsEndpointConfig(undefined, true)
    expect(result.shouldUsePortfolioEndpoint).toBe(false)
    expect(result.shouldUsePositionsEndpoint).toBe(false)
  })

  it('uses positions endpoint when positions enabled but portfolio disabled', () => {
    const result = getPositionsEndpointConfig(true, false)
    expect(result.shouldUsePortfolioEndpoint).toBe(false)
    expect(result.shouldUsePositionsEndpoint).toBe(true)
  })

  it('uses positions endpoint when positions enabled and portfolio undefined', () => {
    const result = getPositionsEndpointConfig(true, undefined)
    expect(result.shouldUsePortfolioEndpoint).toBe(false)
    expect(result.shouldUsePositionsEndpoint).toBe(true)
  })

  it('uses portfolio endpoint when both features are enabled', () => {
    const result = getPositionsEndpointConfig(true, true)
    expect(result.shouldUsePortfolioEndpoint).toBe(true)
    expect(result.shouldUsePositionsEndpoint).toBe(false)
  })

  it('returns both false when both features are disabled', () => {
    const result = getPositionsEndpointConfig(false, false)
    expect(result.shouldUsePortfolioEndpoint).toBe(false)
    expect(result.shouldUsePositionsEndpoint).toBe(false)
  })

  it('returns both false when both features are undefined', () => {
    const result = getPositionsEndpointConfig(undefined, undefined)
    expect(result.shouldUsePortfolioEndpoint).toBe(false)
    expect(result.shouldUsePositionsEndpoint).toBe(false)
  })
})
