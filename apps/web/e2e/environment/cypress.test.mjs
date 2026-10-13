import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cypressEnvironment,
  exposedValues,
  forkShardCount,
  isRemoteBackendHost,
  planShards,
  selectCypressSpecs,
} from './cypress.mjs'
import { isolatedSpecs } from './specs.mjs'
import { createOwners } from './scenarios/safe.mjs'
import { Wallet, verifyMessage } from 'ethers'

const local = {
  SAFE_E2E_ISOLATED: 'true',
  SAFE_CGW_BASE_URL: 'http://localhost:8000/cgw/',
  SAFE_TXS_BASE_URL: 'http://localhost:8000/txs/api/',
  SAFE_RPC_URL: 'http://localhost:8545/',
}

test('blocks remote backend hosts without treating the static asset CDN as a transaction service', () => {
  for (const host of [
    'safe-client.safe.global',
    'safe-client.staging.5afe.dev',
    'safe-decoder.safe.global',
    'safe-transaction-sepolia.safe.global',
    'sepolia.infura.io',
    'eth-sepolia.g.alchemy.com',
  ]) {
    assert.equal(isRemoteBackendHost(host), true, host)
  }
  for (const host of [
    'localhost',
    'rpc.safe-e2e.test',
    'safe-transaction-assets.safe.global',
    'safe-transaction-assets.staging.5afe.dev',
  ]) {
    assert.equal(isRemoteBackendHost(host), false, host)
  }
})

const assets = 'cypress/e2e/regression/assets.cy.js'
const assetsSmoke = 'cypress/e2e/smoke/assets.cy.js'
const rejection = 'cypress/e2e/regression/tx_queue_reject_btn.cy.js'

test('selects only registered specs and supports a focused local rerun', () => {
  assert.deepEqual(selectCypressSpecs(), Object.keys(isolatedSpecs))
  assert.deepEqual(selectCypressSpecs('regression/assets'), [assets])
  assert.deepEqual(selectCypressSpecs('spaces_basicflow'), ['cypress/e2e/regression/spaces_basicflow.cy.js'])
  assert.deepEqual(selectCypressSpecs('tx_queue_reject_btn, regression/assets,tx_queue_reject_btn'), [
    rejection,
    assets,
  ])
})

test('rejects unknown or empty spec selection instead of running staging-dependent specs', () => {
  for (const selection of ['', '*', 'not_registered_spec', '../tx_queue_delete_btn', 'tx_queue_delete_btn,']) {
    assert.throws(() => selectCypressSpecs(selection), /No isolated scenario/)
  }
})

test('requires suite-qualified selection when existing specs share a file name', () => {
  assert.throws(() => selectCypressSpecs('assets'), /Ambiguous isolated scenario/)
  assert.deepEqual(selectCypressSpecs('regression/assets,smoke/assets'), [assets, assetsSmoke])
})

test('browser credentials sign for the generated scenario owners', async () => {
  const { owner1, owner2, owner3, owner4, credentials } = createOwners()
  const message = 'isolated-owner-role'
  const signature = await new Wallet(credentials.OWNER_4_PRIVATE_KEY).signMessage(message)
  assert.equal(verifyMessage(message, signature), owner4.address)
  assert.equal(new Set([owner1, owner2, owner3, owner4].map(({ address }) => address)).size, 4)
  for (const [key, wallet] of [
    ['OWNER_1', owner1],
    ['OWNER_2', owner2],
    ['OWNER_3', owner3],
    ['OWNER_4', owner4],
  ]) {
    assert.equal(new Wallet(credentials[`${key}_PRIVATE_KEY`]).address, wallet.address)
    assert.equal(credentials[`${key}_WALLET_ADDRESS`], wallet.address)
  }
})

test('preserves path prefixes and excludes remote credentials in isolated browser config', () => {
  const result = cypressEnvironment({
    ...local,
    FORK_RPC_URL: 'secret',
    SEPOLIA_FORK_RPC_URL: 'sepolia-secret',
    CYPRESS_WALLET_CREDENTIALS: 'remote-secret',
  })
  assert.equal(result.SAFE_CGW_BASE_URL, 'http://localhost:8000/cgw')
  assert.equal(result.SAFE_TXS_BASE_URL, 'http://localhost:8000/txs/api')
  assert.equal(result.FORK_RPC_URL, undefined)
  assert.equal(result.SEPOLIA_FORK_RPC_URL, undefined)
  assert.equal(result.CYPRESS_WALLET_CREDENTIALS, undefined)
})

test('exposes only the public values to the browser', () => {
  const isolated = exposedValues(cypressEnvironment(local))
  assert.deepEqual(Object.keys(isolated).sort(), [
    'SAFE_CGW_BASE_URL',
    'SAFE_E2E_ISOLATED',
    'SAFE_TXS_BASE_URL',
    'TX_BUILDER_URL',
  ])
  const staging = exposedValues(
    cypressEnvironment({ CYPRESS_WALLET_CREDENTIALS: 'secret', INFURA_API_KEY: 'secret', BEAMER_DATA_E2E: '{}' }),
  )
  assert.deepEqual(staging, { BEAMER_DATA_E2E: '{}' })
  assert.deepEqual(exposedValues({}), {})
})

test('points isolated Safe App specs at the locally served Transaction Builder', () => {
  assert.equal(cypressEnvironment(local).TX_BUILDER_URL, 'http://localhost:4000')
  assert.equal(cypressEnvironment({}).TX_BUILDER_URL, undefined)
})

test('rejects partial or remote configuration before starting isolated tests', () => {
  assert.throws(() => cypressEnvironment({ SAFE_E2E_ISOLATED: 'true' }))
  for (const key of ['SAFE_CGW_BASE_URL', 'SAFE_TXS_BASE_URL', 'SAFE_RPC_URL']) {
    assert.throws(() => cypressEnvironment({ ...local, [key]: 'https://safe-client.safe.global' }), /local stack/)
  }
})

test('passes local chain endpoints to scenarios and rejects remote ones', () => {
  const chain = { rpcUrl: 'http://localhost:8547/', transactionServiceUrl: 'http://localhost:8000/txs-mainnet/api' }
  assert.deepEqual(cypressEnvironment({ ...local, SAFE_E2E_CHAINS: JSON.stringify({ 1: chain }) }).SAFE_E2E_CHAINS, {
    1: { rpcUrl: 'http://localhost:8547', transactionServiceUrl: 'http://localhost:8000/txs-mainnet/api' },
  })
  assert.deepEqual(cypressEnvironment(local).SAFE_E2E_CHAINS, {})
  const remote = JSON.stringify({ 1: { ...chain, rpcUrl: 'https://mainnet.infura.io/v3/key' } })
  assert.throws(
    () => cypressEnvironment({ ...local, SAFE_E2E_CHAINS: remote }),
    /Chain 1 RPC must point to the local stack/,
  )
})

test('limits token setup to the selected isolated Docker project', () => {
  assert.equal(cypressEnvironment(local).SAFE_E2E_PROJECT, 'safe-e2e-local')
  assert.equal(
    cypressEnvironment({ ...local, SAFE_E2E_PROJECT: 'safe-e2e-developer' }).SAFE_E2E_PROJECT,
    'safe-e2e-developer',
  )
  for (const project of ['production', '../safe-e2e-local', 'safe-e2e-local;echo']) {
    assert.throws(() => cypressEnvironment({ ...local, SAFE_E2E_PROJECT: project }), /Invalid SAFE_E2E_PROJECT/)
  }
})

test('retains legacy configuration without forwarding archive provider credentials', () => {
  assert.deepEqual(
    cypressEnvironment({
      CYPRESS_WALLET_CREDENTIALS: 'legacy',
      FORK_RPC_URL: 'secret',
      SEPOLIA_FORK_RPC_URL: 'sepolia-secret',
    }),
    {
      CYPRESS_WALLET_CREDENTIALS: 'legacy',
    },
  )
})

test('plans shards that cover every spec once and start forks only where a spec needs them', () => {
  const specs = Object.keys(isolatedSpecs)
  const needsForks = (spec) => Boolean(isolatedSpecs[spec].chains)
  const shards = planShards(specs, 6)
  assert.equal(shards.length, 6)
  assert.deepEqual(shards.flatMap(({ specs }) => specs).sort(), [...specs].sort())
  for (const shard of shards) {
    assert.equal(shard.chains.length > 0, shard.specs.some(needsForks))
  }
  assert.deepEqual(planShards([assets], 4), [{ specs: [assets], chains: [] }])
  assert.throws(() => planShards(specs, 0), /positive integer/)
})

test('fills the fork shards with plain specs so that all shards cost about the same', () => {
  const registry = Object.fromEntries([
    ...Array.from({ length: 97 }, (_, index) => [`cypress/e2e/test/plain-${index}.cy.js`, {}]),
    ...Array.from({ length: 17 }, (_, index) => [`cypress/e2e/test/fork-${index}.cy.js`, { chains: [1] }]),
  ])
  const cost = ({ specs }) => {
    const forks = specs.filter((spec) => registry[spec].chains).length
    return specs.length - forks + (forks ? forks * 1.2 + 2.5 : 0)
  }
  const costs = planShards(Object.keys(registry), 6, registry).map(cost)
  assert.ok(Math.max(...costs) - Math.min(...costs) <= 1.2, `unbalanced shards: ${costs}`)
  assert.ok(Math.max(...costs) <= 21)
})

test('gives the slower fork specs enough shards that they do not hold up the run', () => {
  // 97 plain and 17 fork specs, as in CI: one fork shard would cost 22.9 against an average of 20.4.
  assert.equal(forkShardCount(97, 17, 6), 2)
  assert.equal(forkShardCount(97, 17, 8), 2)
  assert.equal(forkShardCount(97, 0, 6), 0)
  assert.equal(forkShardCount(0, 17, 6), 6)
  assert.equal(forkShardCount(3, 1, 1), 1)
})

test('keeps fork specs that need the same forks in the same shard', () => {
  const registry = {
    'cypress/e2e/test/plain.cy.js': {},
    'cypress/e2e/test/mainnet-a.cy.js': { chains: [1] },
    'cypress/e2e/test/polygon-a.cy.js': { chains: [137] },
    'cypress/e2e/test/mainnet-b.cy.js': { chains: [1] },
    'cypress/e2e/test/polygon-b.cy.js': { chains: [137] },
  }
  const forkShards = planShards(Object.keys(registry), 3, registry).filter(({ chains }) => chains.length)
  assert.deepEqual(
    forkShards.map(({ chains }) => chains),
    [['mainnet'], ['polygon']],
  )
})
