import { SEPOLIA } from './chain.mjs'

// The TXS endpoint behind each CGW route; `samePredicate`: the scenario's condition applies to its JSON too.
const TRANSACTION_SERVICE_ROUTES = [
  { pattern: /^safes\/(0x[0-9a-fA-F]{40})\/transactions\/creation$/, path: 'safes/$1/creation/', samePredicate: true },
  { pattern: /^owners\/(0x[0-9a-fA-F]{40})\/safes$/, path: 'owners/$1/safes/', samePredicate: true },
  {
    pattern: /^transactions\/multisig_0x[0-9a-fA-F]{40}_(0x[0-9a-fA-F]{64})$/,
    path: 'multisig-transactions/$1/',
    samePredicate: false,
  },
  { pattern: /^safes\/(0x[0-9a-fA-F]{40})(\/.*)?$/, path: 'safes/$1/', samePredicate: false },
]

const TIMEOUT_MS = 120_000
// The local indexer runs every second, so a shorter poll ends the wait soon after the data is ready.
const POLL_INTERVAL_MS = 250

const transactionServiceUrl = (env, chainId) =>
  Number(chainId) === SEPOLIA ? env.SAFE_TXS_BASE_URL : env.SAFE_E2E_CHAINS?.[chainId]?.transactionServiceUrl

/** The TXS request to wait on before asking CGW for `url`, if the run knows the chain's Transaction Service. */
export function transactionServiceCheck(env, url) {
  const match = new URL(url).pathname.match(/\/v1\/chains\/(\d+)\/(.+)$/)
  if (!match) return undefined
  const [, chainId, rest] = match
  const route = TRANSACTION_SERVICE_ROUTES.find(({ pattern }) => pattern.test(rest))
  const base = transactionServiceUrl(env, chainId)
  if (!route || !base) return undefined
  return { url: `${base}/v1/${rest.replace(route.pattern, route.path)}`, samePredicate: route.samePredicate }
}

/** Polls `url` until `isReady(response)`; returns the last status or error text if the deadline passes first. */
export async function poll(url, isReady, deadline) {
  let last = 'no response'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      if (await isReady(response)) return undefined
      last = `status ${response.status}`
    } catch (error) {
      if (error.name !== 'TimeoutError') throw error
      last = 'request timed out'
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  return last
}

/**
 * Waits until the JSON at `url` (CGW or TXS) satisfies `predicate`. For CGW URLs it first waits for the
 * Transaction Service, because CGW caches early answers and indexing a new Safe sends no event that clears them.
 */
export async function waitUntil(env, url, predicate) {
  const deadline = Date.now() + TIMEOUT_MS
  const matches = async (response) => response.ok && predicate(await response.json())
  const check = transactionServiceCheck(env, url)
  if (check) {
    const indexed = async (response) => response.ok && (!check.samePredicate || predicate(await response.json()))
    const last = await poll(check.url, indexed, deadline)
    if (last) throw new Error(`Transaction Service never served ${new URL(check.url).pathname} as expected (${last})`)
  }
  const last = await poll(url, matches, deadline)
  if (last) throw new Error(`${new URL(url).pathname} never matched the scenario (${last})`)
}

/** Waits until the CGW queue of the Safe at `context.path` lists every Safe transaction hash. */
export function waitForQueued(env, context, hashes) {
  return waitUntil(env, `${context.path}/transactions/queued`, (queue) =>
    hashes.every((hash) => JSON.stringify(queue).includes(hash)),
  )
}
