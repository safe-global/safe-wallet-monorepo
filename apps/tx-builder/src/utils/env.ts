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
