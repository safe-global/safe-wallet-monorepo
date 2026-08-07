import { defaultGatewayHandlers } from './defaults/gateway'
import { defaultChainHandlers } from './defaults/chains'
import { hypernativeHandlers } from './defaults/hypernative'

/**
 * The default handler set behind the global msw server in jest
 * (apps/web/src/tests/server.ts, apps/mobile/src/tests/server.ts).
 *
 * Every test file inherits these responses implicitly, so treat the
 * modules under ./defaults as part of the test contract: changing a
 * response body requires a full web test-suite run.
 *
 * Composition order is not significant: no route pattern overlaps
 * across the three modules.
 */
export const handlers = (GATEWAY_URL: string) => [
  ...defaultGatewayHandlers(GATEWAY_URL),
  ...defaultChainHandlers(GATEWAY_URL),
  ...hypernativeHandlers(GATEWAY_URL),
]
