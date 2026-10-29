import { assertProjectName, localUrl } from './local-stack.mjs'
import { isolatedSpecs } from './specs.mjs'

export function isRemoteBackendHost(host) {
  return (
    !['safe-transaction-assets.safe.global', 'safe-transaction-assets.staging.5afe.dev'].includes(host) &&
    /safe-client\.|safe-decoder\.|safe-transaction-|infura\.io|alchemy\.com/.test(host)
  )
}

export function isRemoteBackendRequest(url) {
  return isRemoteBackendHost(new URL(url).hostname)
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
