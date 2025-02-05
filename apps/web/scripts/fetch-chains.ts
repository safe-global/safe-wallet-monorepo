const GATEWAY_URL_PRODUCTION = process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION || 'https://safe-client.safe.global'
const GATEWAY_URL_STAGING = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'
const IS_PRODUCTION = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'

const API_URL = IS_PRODUCTION ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING

async function fetchChains() {
  const response = await fetch(`${API_URL}/v1/chains`)
  if (!response.ok) {
    throw new Error('Failed to fetch chains')
  }
  const data = await response.json()
  return data.results
}

function logChains(json: any) {
  console.log(JSON.stringify(json, null, 2))
}

fetchChains().then(logChains)
