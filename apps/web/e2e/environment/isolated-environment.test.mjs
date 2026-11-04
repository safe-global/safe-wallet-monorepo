import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isolatedEnvironment } from './isolated-environment.mjs'
import { createOwners } from './scenarios/safe.mjs'
import { Wallet, verifyMessage } from 'ethers'

const local = {
  SAFE_E2E_ISOLATED: 'true',
  SAFE_CGW_BASE_URL: 'http://localhost:8000/cgw/',
  SAFE_TXS_BASE_URL: 'http://localhost:8000/txs/api/',
  SAFE_RPC_URL: 'http://localhost:8545/',
}

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

test('preserves path prefixes and excludes remote credentials in the isolated config', () => {
  const result = isolatedEnvironment({
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

test('rejects partial or remote configuration before starting isolated tests', () => {
  assert.throws(() => isolatedEnvironment({ SAFE_E2E_ISOLATED: 'true' }))
  for (const key of ['SAFE_CGW_BASE_URL', 'SAFE_TXS_BASE_URL', 'SAFE_RPC_URL']) {
    assert.throws(() => isolatedEnvironment({ ...local, [key]: 'https://safe-client.safe.global' }), /local stack/)
  }
})

test('passes local chain endpoints to scenarios and rejects remote ones', () => {
  const chain = { rpcUrl: 'http://localhost:8547/', transactionServiceUrl: 'http://localhost:8000/txs-mainnet/api' }
  assert.deepEqual(isolatedEnvironment({ ...local, SAFE_E2E_CHAINS: JSON.stringify({ 1: chain }) }).SAFE_E2E_CHAINS, {
    1: { rpcUrl: 'http://localhost:8547', transactionServiceUrl: 'http://localhost:8000/txs-mainnet/api' },
  })
  assert.deepEqual(isolatedEnvironment(local).SAFE_E2E_CHAINS, {})
  const remote = JSON.stringify({ 1: { ...chain, rpcUrl: 'https://mainnet.infura.io/v3/key' } })
  assert.throws(
    () => isolatedEnvironment({ ...local, SAFE_E2E_CHAINS: remote }),
    /Chain 1 RPC must point to the local stack/,
  )
})

test('limits token setup to the selected isolated Docker project', () => {
  assert.equal(isolatedEnvironment(local).SAFE_E2E_PROJECT, 'safe-e2e-local')
  assert.equal(
    isolatedEnvironment({ ...local, SAFE_E2E_PROJECT: 'safe-e2e-developer' }).SAFE_E2E_PROJECT,
    'safe-e2e-developer',
  )
  for (const project of ['production', '../safe-e2e-local', 'safe-e2e-local;echo']) {
    assert.throws(() => isolatedEnvironment({ ...local, SAFE_E2E_PROJECT: project }), /Invalid SAFE_E2E_PROJECT/)
  }
})

test('outside the stack, passes the environment on without fork RPC URLs', () => {
  assert.deepEqual(
    isolatedEnvironment({
      PLAYWRIGHT_BASE_URL: 'http://localhost:3000',
      FORK_RPC_URL: 'secret',
      SEPOLIA_FORK_RPC_URL: 'sepolia-secret',
    }),
    {
      PLAYWRIGHT_BASE_URL: 'http://localhost:3000',
    },
  )
})
