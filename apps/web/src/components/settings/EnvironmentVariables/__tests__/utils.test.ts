import { isTenderlySimulateUrl, TENDERLY_SIMULATE_URL_PLACEHOLDER } from '../utils'

describe('isTenderlySimulateUrl', () => {
  it('accepts a Simulation API URL', () => {
    expect(isTenderlySimulateUrl('https://api.tenderly.co/api/v1/account/my-org/project/my-project/simulate')).toBe(
      true,
    )
  })

  it('rejects the project dashboard URL', () => {
    expect(isTenderlySimulateUrl('https://dashboard.tenderly.co/my-org/my-project')).toBe(false)
  })

  it('rejects the project URL on the API host without the simulate path', () => {
    expect(isTenderlySimulateUrl('https://api.tenderly.co/api/v1/account/my-org/project/my-project')).toBe(false)
  })

  it('rejects a simulate path on another host', () => {
    expect(isTenderlySimulateUrl('https://example.com/api/v1/account/my-org/project/my-project/simulate')).toBe(false)
  })

  it('rejects a simulate path with a trailing slash', () => {
    expect(isTenderlySimulateUrl('https://api.tenderly.co/api/v1/account/my-org/project/my-project/simulate/')).toBe(
      false,
    )
  })

  it('accepts the placeholder, whose slug braces survive URL parsing as percent-encoded path segments', () => {
    expect(isTenderlySimulateUrl(TENDERLY_SIMULATE_URL_PLACEHOLDER)).toBe(true)
  })

  it('rejects values that are not URLs', () => {
    expect(isTenderlySimulateUrl('api.tenderly.co/api/v1/account/my-org/project/my-project/simulate')).toBe(false)
    expect(isTenderlySimulateUrl('')).toBe(false)
  })
})
