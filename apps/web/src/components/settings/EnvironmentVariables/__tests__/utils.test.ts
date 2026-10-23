import {
  getTenderlyUrlError,
  isTenderlySimulateUrl,
  TENDERLY_SIMULATE_URL_PLACEHOLDER,
  TENDERLY_URL_ERROR,
  TENDERLY_URL_MISSING_SIMULATE_ERROR,
} from '../utils'

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

  it('accepts a simulate path on a self-hosted Tenderly instance', () => {
    expect(
      isTenderlySimulateUrl('https://tenderly.acme-corp.com/api/v1/account/my-org/project/my-project/simulate'),
    ).toBe(true)
  })

  it('accepts a simulate path with a trailing slash', () => {
    expect(isTenderlySimulateUrl('https://api.tenderly.co/api/v1/account/my-org/project/my-project/simulate/')).toBe(
      true,
    )
  })

  it('rejects the placeholder with its slug braces unreplaced', () => {
    expect(isTenderlySimulateUrl(TENDERLY_SIMULATE_URL_PLACEHOLDER)).toBe(false)
  })

  it('rejects a non-https URL', () => {
    expect(isTenderlySimulateUrl('http://api.tenderly.co/api/v1/account/my-org/project/my-project/simulate')).toBe(
      false,
    )
  })

  it('rejects values that are not URLs', () => {
    expect(isTenderlySimulateUrl('api.tenderly.co/api/v1/account/my-org/project/my-project/simulate')).toBe(false)
    expect(isTenderlySimulateUrl('')).toBe(false)
  })
})

describe('getTenderlyUrlError', () => {
  it('returns nothing for a Simulation API URL', () => {
    expect(getTenderlyUrlError('https://api.tenderly.co/api/v1/account/my-org/project/my-project/simulate')).toBe(true)
  })

  it('tells the user to append /simulate when the project API URL was copied as is', () => {
    expect(getTenderlyUrlError('https://api.tenderly.co/api/v1/account/my-org/project/my-project')).toBe(
      TENDERLY_URL_MISSING_SIMULATE_ERROR,
    )
    expect(getTenderlyUrlError('https://api.tenderly.co/api/v1/account/my-org/project/my-project/')).toBe(
      TENDERLY_URL_MISSING_SIMULATE_ERROR,
    )
  })

  it('returns the generic error for a dashboard URL', () => {
    expect(getTenderlyUrlError('https://dashboard.tenderly.co/my-org/my-project')).toBe(TENDERLY_URL_ERROR)
  })

  it('returns the generic error for the unreplaced placeholder', () => {
    expect(getTenderlyUrlError(TENDERLY_SIMULATE_URL_PLACEHOLDER)).toBe(TENDERLY_URL_ERROR)
  })
})
