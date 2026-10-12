import { assertProjectName, chainProfiles, localUrl } from './local-stack.mjs'
import { isolatedSpecs } from './specs.mjs'

export function isRemoteBackendHost(host) {
  return (
    !['safe-transaction-assets.safe.global', 'safe-transaction-assets.staging.5afe.dev'].includes(host) &&
    /safe-client\.|safe-decoder\.|safe-transaction-|infura\.io|alchemy\.com/.test(host)
  )
}

/** Resolves a comma-separated list of `name` or `suite/name` to registered spec paths; all specs when unset. */
export function selectCypressSpecs(selection, specs = isolatedSpecs) {
  const supported = Object.keys(specs)
  if (selection === undefined) return supported
  const resolve = (name) => {
    const matches = supported.filter(
      (path) => path.split('/').at(-1) === `${name}.cy.js` || path === `cypress/e2e/${name}.cy.js`,
    )
    if (!matches.length) throw new Error(`No isolated scenario registered for ${name}`)
    if (matches.length > 1) throw new Error(`Ambiguous isolated scenario: use the suite/name for ${name}`)
    return matches[0]
  }
  return [...new Set(selection.split(',').map((name) => resolve(name.trim())))]
}

export function requiredChains(selected, specs = isolatedSpecs) {
  return [...new Set(selected.flatMap((spec) => specs[spec]?.chains ?? []))]
}

const EXPOSED_KEYS = [
  'SAFE_E2E_ISOLATED',
  'SAFE_CGW_BASE_URL',
  'SAFE_TXS_BASE_URL',
  'TX_BUILDER_URL',
  'BEAMER_DATA_E2E',
]

/** The public part of the Cypress environment, which specs read synchronously with Cypress.expose(). */
export function exposedValues(environment) {
  return Object.fromEntries(EXPOSED_KEYS.filter((key) => key in environment).map((key) => [key, environment[key]]))
}

export function cypressEnvironment(env) {
  if (env.SAFE_E2E_ISOLATED !== 'true') {
    return Object.fromEntries(
      Object.entries(env).filter(([key]) => !key.startsWith('FORK_') && key !== 'SEPOLIA_FORK_RPC_URL'),
    )
  }
  const result = { SAFE_E2E_ISOLATED: true }
  result.SAFE_E2E_PROJECT = assertProjectName(env.SAFE_E2E_PROJECT || 'safe-e2e-local')
  for (const key of ['SAFE_CGW_BASE_URL', 'SAFE_TXS_BASE_URL', 'SAFE_RPC_URL']) {
    result[key] = localUrl(env[key], key)
  }
  // The monorepo Transaction Builder, served at the URL the local config service lists.
  result.TX_BUILDER_URL = 'http://localhost:4000'
  result.SAFE_E2E_CHAINS = Object.fromEntries(
    Object.entries(JSON.parse(env.SAFE_E2E_CHAINS || '{}')).map(([chainId, chain]) => [
      chainId,
      {
        rpcUrl: localUrl(chain.rpcUrl, `Chain ${chainId} RPC`),
        transactionServiceUrl: localUrl(chain.transactionServiceUrl, `Chain ${chainId} Transaction Service`),
      },
    ]),
  )
  return result
}

// Measured in CI with one Cypress process per shard: a spec that needs a fork takes about 1.5 times as long
// as one that does not, and starting the forks adds about 2.5 specs' worth of setup to a shard.
const FORK_SPEC_COST = 1.5
const FORK_SETUP_COST = 2.5

/** How many of `count` shards the fork specs get, so that the longest shard is as short as possible. */
export function forkShardCount(plainSpecs, forkSpecs, count) {
  if (!forkSpecs) return 0
  if (!plainSpecs || count < 2) return Math.min(Math.max(count - 1, 1), forkSpecs)
  let best = 1
  let bestCost = Infinity
  for (let forkShards = 1; forkShards <= Math.min(forkSpecs, count - 1); forkShards++) {
    const forkCost = (forkSpecs * FORK_SPEC_COST) / forkShards + FORK_SETUP_COST
    const cost = Math.max(forkCost, plainSpecs / (count - forkShards))
    if (cost < bestCost) [best, bestCost] = [forkShards, cost]
  }
  return best
}

// Fork specs sorted by the forks they need, then cut into consecutive chunks, so that each shard starts as
// few forks as possible.
function chunkByForks(forkSpecs, shardCount, specs) {
  const chainKey = (spec) => specs[spec].chains.join(',')
  const sorted = [...forkSpecs].sort((a, b) => chainKey(a).localeCompare(chainKey(b)))
  return Array.from({ length: shardCount }, (_, index) =>
    sorted.slice(
      Math.round((index * sorted.length) / shardCount),
      Math.round(((index + 1) * sorted.length) / shardCount),
    ),
  )
}

/**
 * Splits specs into shards for parallel CI jobs. Specs that need extra forks get their own shards, so only those
 * jobs start the forks; {@link forkShardCount} decides how many, from the measured relative costs.
 */
export function planShards(selected, count, specs = isolatedSpecs) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Shard count must be a positive integer')
  const needsForks = (spec) => Boolean(specs[spec]?.chains)
  const plain = selected.filter((spec) => !needsForks(spec))
  const forked = selected.filter(needsForks)
  const forkShards = forkShardCount(plain.length, forked.length, count)
  const plainShards = plain.length ? Math.min(plain.length, Math.max(1, count - forkShards)) : 0
  const plainBuckets = Array.from({ length: plainShards }, () => [])
  plain.forEach((spec, index) => plainBuckets[index % plainShards].push(spec))
  return [...plainBuckets, ...chunkByForks(forked, forkShards, specs)].map((bucket) => ({
    specs: bucket,
    chains: requiredChains(bucket, specs).map((id) => chainProfiles[id]),
  }))
}
