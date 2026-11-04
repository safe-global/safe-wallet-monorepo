import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { handlers } from '@safe-global/test/msw/handlers'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { OwnedSafes } from '@safe-global/store/gateway/types'
import { GATEWAY_URL } from '@/config/gateway'

const notFound = () => new HttpResponse(null, { status: 404 })

// Empty answers for gateway calls that tests trigger without mocking; the shared handlers match first
const emptyGatewayHandlers = [
  http.get(`${GATEWAY_URL}/v1/auth/me`, () => new HttpResponse(null, { status: 403 })),
  http.get<never, never, OwnedSafes>(`${GATEWAY_URL}/v1/chains/:chainId/owners/:ownerAddress/safes`, () =>
    HttpResponse.json({ safes: [] }),
  ),
  http.get<never, never, Balances>(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, () =>
    HttpResponse.json({ fiatTotal: '0', items: [] }),
  ),
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/nonces`, notFound),
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/contracts/:address`, notFound),
  http.post(`${GATEWAY_URL}/v1/chains/:chainId/security/:safeAddress/counterparty-analysis`, notFound),
  http.get(`${GATEWAY_URL}/v1/spaces/:spaceId`, notFound),
  http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/address-book`, notFound),
  http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/entitlements`, notFound),
]

export const server = setupServer(...handlers(GATEWAY_URL), ...emptyGatewayHandlers)
