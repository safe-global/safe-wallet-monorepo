export const LATEST_SAFE_VERSION =
  process.env.NEXT_PUBLIC_SAFE_VERSION || process.env.EXPO_PUBLIC_SAFE_VERSION || '1.4.1' // Risk mitigation (Blockaid)
export const BLOCKAID_API = 'https://client.blockaid.io'
export const BLOCKAID_CLIENT_ID = process.env.NEXT_PUBLIC_BLOCKAID_CLIENT_ID // Safe Apps
// Access keys
export const INFURA_TOKEN = process.env.NEXT_PUBLIC_INFURA_TOKEN || process.env.EXPO_PUBLIC_INFURA_TOKEN || ''
export const SAFE_APPS_INFURA_TOKEN =
  process.env.NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN || process.env.EXPO_PUBLIC_SAFE_APPS_INFURA_TOKEN || INFURA_TOKEN

// Tenderly - API docs: https://www.notion.so/Simulate-API-Documentation-6f7009fe6d1a48c999ffeb7941efc104
export const TENDERLY_SIMULATE_ENDPOINT_URL =
  process.env.NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL || process.env.EXPO_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL || ''
export const TENDERLY_PROJECT_NAME =
  process.env.NEXT_PUBLIC_TENDERLY_PROJECT_NAME || process.env.EXPO_PUBLIC_TENDERLY_PROJECT_NAME || ''
export const TENDERLY_ORG_NAME =
  process.env.NEXT_PUBLIC_TENDERLY_ORG_NAME || process.env.EXPO_PUBLIC_TENDERLY_ORG_NAME || ''
