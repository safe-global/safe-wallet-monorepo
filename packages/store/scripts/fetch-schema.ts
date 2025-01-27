const PRODUCTION_CGW_API_URL = process.env.PRODUCTION_CGW_API_URL || 'https://safe-client.safe.global/api-json'
const STAGING_CGW_API_URL = process.env.STAGING_CGW_API_URL || 'https://safe-client.staging.5afe.dev/api-json'

const apiUrl = process.env.NODE_ENV === 'dev' ? STAGING_CGW_API_URL : PRODUCTION_CGW_API_URL

fetch(apiUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  })
  .then((data) => {
    console.log(JSON.stringify(data, null, 2))
  })
