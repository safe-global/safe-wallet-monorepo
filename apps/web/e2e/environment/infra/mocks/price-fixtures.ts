import { isMain, json, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const PORT = 8091
const RATES: Record<string, number> = { usd: 2000, eur: 1800 }
const NATIVE_RATES: Record<string, Record<string, number>> = {
  ethereum: RATES,
  'polygon-ecosystem-token': { usd: 0.5, eur: 0.45 },
}

function nativePrices(query: URLSearchParams): Reply {
  const currencies = (query.get('vs_currencies') ?? '').split(',')
  if (currencies.some((currency) => !(currency in RATES))) return json(400, { error: 'Unsupported fixture currency' })
  const prices: Record<string, Record<string, number>> = {}
  for (const coin of (query.get('ids') ?? '').split(',')) {
    const rates = NATIVE_RATES[coin]
    if (!rates) continue
    prices[coin] = {}
    for (const currency of currencies) {
      prices[coin][currency] = rates[currency]
      prices[coin][`${currency}_24h_change`] = 0
    }
  }
  return json(200, prices)
}

export function dispatch({ path, query }: Pick<MockRequest, 'path' | 'query'>): Reply {
  if (path === '/health') return json(200, { ready: true })
  if (path === '/simple/supported_vs_currencies') return json(200, Object.keys(RATES))
  if (path === '/simple/price') return nativePrices(query)
  if (path.startsWith('/simple/token_price/')) return json(200, {})
  return json(404, { error: 'No provider fixture' })
}

if (isMain(import.meta.url)) serve(PORT, dispatch)
