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

/**
 * Splits specs into at most `count` shards for parallel CI jobs. Specs that need extra forks get their own
 * shards, so only those jobs start the forks; each group gets a share of the jobs by its size.
 */
export function planShards(selected, count, specs = isolatedSpecs) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Shard count must be a positive integer')
  const needsForks = (spec) => Boolean(specs[spec]?.chains)
  const groups = [selected.filter((spec) => !needsForks(spec)), selected.filter(needsForks)]
    .filter((group) => group.length)
    .map((group) => ({ specs: group, chains: requiredChains(group, specs) }))
  const shards = []
  for (const group of groups) {
    const share = Math.max(1, Math.min(group.specs.length, Math.round((count * group.specs.length) / selected.length)))
    const buckets = Array.from({ length: share }, () => [])
    group.specs.forEach((spec, index) => buckets[index % share].push(spec))
    shards.push(...buckets.map((bucket) => ({ specs: bucket, chains: group.chains.map((id) => chainProfiles[id]) })))
  }
  return shards
}
