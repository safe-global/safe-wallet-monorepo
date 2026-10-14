import { setBaseUrl } from '@safe-global/safe-gateway-typescript-sdk'
import { getGatewayUrl } from '../utils/env'

/** Points the gateway SDK at the configured Client Gateway; without one it keeps the production default. */
export function configureGateway(gatewayUrl = getGatewayUrl()): void {
  if (gatewayUrl) setBaseUrl(gatewayUrl)
}
