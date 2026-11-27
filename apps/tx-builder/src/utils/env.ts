// Environment utilities - extracted to allow mocking in tests
export const isProdEnv = (): boolean => {
  try {
    return import.meta.env.MODE === 'production'
  } catch {
    return false
  }
}

// When set, this Client Gateway serves every gateway request, and it is the only ABI provider.
export const getGatewayUrl = (): string | undefined => import.meta.env.VITE_GATEWAY_URL || undefined

export const getTenderlyConfig = () => ({
  simulateEndpointUrl: import.meta.env.VITE_TENDERLY_SIMULATE_ENDPOINT_URL || '',
  projectName: import.meta.env.VITE_TENDERLY_PROJECT_NAME || '',
  orgName: import.meta.env.VITE_TENDERLY_ORG_NAME || '',
})
