const PRODUCTION_CGW_API_URL = process.env.PRODUCTION_CGW_API_URL || 'https://safe-client.safe.global/api-json'
const STAGING_CGW_API_URL = process.env.STAGING_CGW_API_URL || 'https://safe-client.staging.5afe.dev/api-json'
const LOCAL_CGW_API_URL = process.env.LOCAL_CGW_API_URL || 'http://localhost:3000/api-json'

let apiUrl = PRODUCTION_CGW_API_URL

if (process.env.NODE_ENV === 'local') {
  apiUrl = LOCAL_CGW_API_URL
} else if (process.env.NODE_ENV === 'dev') {
  apiUrl = STAGING_CGW_API_URL
}

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
