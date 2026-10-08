export const TENDERLY_SIMULATE_URL_PLACEHOLDER =
  'https://api.tenderly.co/api/v1/account/{account_slug}/project/{project_slug}/simulate'

export const TENDERLY_TOKEN_PLACEHOLDER = 'Paste your access token here'

export const TENDERLY_SETUP_GUIDE_URL =
  'https://docs.tenderly.co/simulations/guides/safe-wallet#simulate-safe-wallet-transactions-in-your-tenderly-project'

export const TENDERLY_URL_HELPER_TEXT = 'Copy the Simulation API URL from your Tenderly project. It ends in /simulate.'

export const TENDERLY_URL_ERROR = 'This is not a Simulation API URL. Copy it from your Tenderly project.'

export const isTenderlySimulateUrl = (value: string): boolean => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  // Braces survive URL parsing percent-encoded, so an unreplaced {account_slug} would otherwise pass as a real path
  return url.protocol === 'https:' && !/%7B|%7D/i.test(url.pathname) && /\/simulate\/?$/.test(url.pathname)
}
