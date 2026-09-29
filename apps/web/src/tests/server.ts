import { setupServer } from 'msw/node'
import { handlers } from '@safe-global/test/msw/handlers'
// Not GATEWAY_URL from @/config/gateway: its imports load protocol-kit, and this file is loaded by the setup of every test file
import { GATEWAY_URL_STAGING } from '@/config/gatewayUrls'

export const server = setupServer(...handlers(GATEWAY_URL_STAGING))
