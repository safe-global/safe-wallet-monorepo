export const LATEST_SAFE_VERSION =
  process.env.NEXT_PUBLIC_SAFE_VERSION || process.env.EXPO_PUBLIC_SAFE_VERSION || '1.4.1' // Risk mitigation (Blockaid)
export const BLOCKAID_API = 'https://client.blockaid.io'
export const BLOCKAID_CLIENT_ID = process.env.NEXT_PUBLIC_BLOCKAID_CLIENT_ID // Safe Apps
// Access keys
export const INFURA_TOKEN = process.env.NEXT_PUBLIC_INFURA_TOKEN || process.env.EXPO_PUBLIC_INFURA_TOKEN || ''
export const SAFE_APPS_INFURA_TOKEN =
  process.env.NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN || process.env.EXPO_PUBLIC_SAFE_APPS_INFURA_TOKEN || INFURA_TOKEN
