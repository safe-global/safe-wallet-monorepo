import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInLocalService } from './scenarios/local-service.mjs'
import { registerContract } from './scenarios/contracts.mjs'
import { ensFixtureFiles, setEnsName } from './scenarios/ens.mjs'
import { localAddress } from './scenarios/staging.mjs'

test('metadata commands reject unrelated projects and services before accessing Docker', async () => {
  for (const project of [undefined, 'production', '../safe-e2e-local', 'safe-e2e-local;echo']) {
    await assert.rejects(runInLocalService({ SAFE_E2E_PROJECT: project }, 'txs-web', []), /Invalid SAFE_E2E_PROJECT/)
  }
  for (const service of ['anvil', 'cgw-web', 'txs-web;echo']) {
    await assert.rejects(runInLocalService({ SAFE_E2E_PROJECT: 'safe-e2e-local' }, service, []), /does not support/)
  }
})

test('decoder metadata requires the supported chain, a valid address, name and ABI', async () => {
  const contract = {
    address: '0x0000000000000000000000000000000000000001',
    chainId: 11155111,
    name: 'Fixture',
    abi: [{ type: 'constructor', inputs: [] }],
  }
  for (const invalid of [{ address: 'invalid' }, { chainId: 1 }, { name: '' }, { abi: [] }, { abi: {} }]) {
    await assert.rejects(registerContract({}, { ...contract, ...invalid }), /Sepolia address, name and ABI/)
  }
})

test('ENS setup requires a .eth name and a valid address before accessing the fork', async () => {
  const address = '0x0000000000000000000000000000000000000001'
  for (const [name, value] of [
    [undefined, address],
    ['example.com', address],
    ['example.eth', 'invalid'],
  ]) {
    await assert.rejects(setEnsName({}, name, value), /\.eth name and an address/)
  }
})

test('the ENS fixture answers the mocked resolver call with the scenario address', async () => {
  const address = '0x00000000000000000000000000000000000000ab'
  const files = await ensFixtureFiles(address)
  assert.equal(
    files['ens_e2etestsafe.json']['0x8fade66b79cc9f707ab26799354482eb93a5b7dd'],
    `0x${'0'.repeat(24)}${address.slice(2)}`,
  )
  await assert.rejects(ensFixtureFiles('invalid'), /requires an address/)
})

test('staging wallets that sign in tests map to generated owners and other addresses stay unchanged', () => {
  const owners = { owner4: { address: '0x1' }, owner1: { address: '0x2' }, owner3: { address: '0x3' } }
  assert.equal(localAddress(owners, '0xc16db0251654c0a72e91b190d81ead367d2c6fed'), '0x1')
  assert.equal(localAddress(owners, '0x8eeC30d6FB6eC104B7308a8847db5FF487152a3b'), '0x2')
  assert.equal(localAddress(owners, '0x4fe7164d7cA511Ab35520bb14065F1693240dC90'), '0x3')
  const unrelated = '0x52835f11E348605E9D791Ec09380a3224526d538'
  assert.equal(localAddress(owners, unrelated), unrelated)
})
