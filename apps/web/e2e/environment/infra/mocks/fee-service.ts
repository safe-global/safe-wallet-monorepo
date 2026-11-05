/**
 * Quotes Pay from Safe fees for the gateway (FEE_SERVICE_BASE_URI) in place of the hosted fee service.
 *
 * The gateway merges the quote into the Safe transaction and asks again before it relays the signed transaction. The
 * Safe refunds the gas to the fee collector; the relay mock submits the transaction.
 */
import { isMain, json, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const PORT = 8096

/** The refund receiver that the wallet accepts (FEE_COLLECTORS in the fee-payment feature) */
export const FEE_COLLECTOR = '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD'
export const SAFE_TX_GAS = '60000'
export const BASE_GAS = '50000'
export const GAS_PRICE = '2000000000'
export const RELAY_COST_FIAT = '0.42'

const RELAY_FEES = /^\/v1\/chains\/(\d+)\/safes\/(0x[0-9a-fA-F]{40})\/transactions\/relay\/fees$/
const CAN_RELAY = /^\/v1\/chains\/\d+\/transactions\/0x[0-9a-fA-F]{64}\/can-relay$/

type FeesRequest = { gasToken?: string; numberSignatures?: number; fiatCode?: string }

function relayFees(chainId: string, safeAddress: string, body: string): Reply {
  const request = (body ? JSON.parse(body) : {}) as FeesRequest
  if (!request.gasToken || !request.numberSignatures) {
    return json(400, { errors: [{ message: 'Fee requests need gasToken and numberSignatures' }] })
  }
  return json(200, {
    txData: {
      chainId,
      safeAddress,
      safeTxGas: SAFE_TX_GAS,
      baseGas: BASE_GAS,
      gasPrice: GAS_PRICE,
      gasToken: request.gasToken,
      refundReceiver: FEE_COLLECTOR,
      numberSignatures: request.numberSignatures,
    },
    relayCost: { fiatCode: request.fiatCode ?? 'USD', fiatValue: RELAY_COST_FIAT },
  })
}

export function dispatch({ method, path, body }: Pick<MockRequest, 'method' | 'path' | 'body'>): Reply {
  if (method === 'GET' && path === '/health') return json(200, { ready: true })
  const fees = RELAY_FEES.exec(path)
  if (method === 'POST' && fees) return relayFees(fees[1], fees[2], body)
  // Every quoted transaction may be relayed; the hosted service also checks the hash against its quotes.
  if (method === 'GET' && CAN_RELAY.test(path)) return json(200, { canRelay: true })
  return json(404, { errors: [{ message: `No route for ${method} ${path}` }] })
}

if (isMain(import.meta.url)) serve(PORT, dispatch)
