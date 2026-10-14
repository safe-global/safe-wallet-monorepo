import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { mergeForkCaches, readForkCache, writeForkCache } from './fork-cache.mjs'

const cache = (overrides) => ({
  meta: { block_env: { number: '0x98b86a' }, hosts: ['fork-upstream'], source_id: '0xproxy' },
  accounts: {},
  storage: {},
  block_hashes: {},
  ...overrides,
})

test('merges accounts, storage slots and block hashes, keeping the first meta', () => {
  const proxy = cache({ accounts: { '0xa': { nonce: 1 } }, storage: { '0xa': { '0x1': '0x5' } } })
  const older = cache({
    meta: { block_env: { number: '0x98b86a' }, hosts: ['sepolia.infura.io'], source_id: '0xkey' },
    accounts: { '0xb': { nonce: 2 } },
    storage: { '0xa': { '0x2': '0x6' }, '0xb': { '0x1': '0x7' } },
    block_hashes: { '0x98b86a': '0xhash' },
  })
  const merged = mergeForkCaches([proxy, older])
  assert.deepEqual(merged.meta, proxy.meta)
  assert.deepEqual(Object.keys(merged.accounts), ['0xa', '0xb'])
  assert.deepEqual(merged.storage, { '0xa': { '0x1': '0x5', '0x2': '0x6' }, '0xb': { '0x1': '0x7' } })
  assert.deepEqual(merged.block_hashes, { '0x98b86a': '0xhash' })
  assert.deepEqual(proxy.storage, { '0xa': { '0x1': '0x5' } })
})

test('drops empty accounts without storage, which runs read only for fresh random addresses', () => {
  const empty = {
    nonce: 0,
    balance: '0x0',
    code_hash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  }
  const first = cache({ accounts: { '0xrandom': empty, '0xfunded': { ...empty, balance: '0x1' } } })
  const second = cache({ accounts: { '0xslotted': empty, '0xused': { ...empty, nonce: 3 } } })
  second.storage = { '0xslotted': { '0x1': '0x2' } }
  const merged = mergeForkCaches([first, second])
  assert.deepEqual(Object.keys(merged.accounts).sort(), ['0xfunded', '0xslotted', '0xused'])
})

test('drops the storage of the system contracts that the stack disables', () => {
  const beaconRoots = '0x000f3df6d732807ef1319fb7b8bb8522d0beac02'
  const merged = mergeForkCaches([cache({ storage: { [beaconRoots]: { '0x1': '0x2' }, '0xa': { '0x1': '0x3' } } })])
  assert.deepEqual(merged.storage, { '0xa': { '0x1': '0x3' } })
})

test('refuses to merge caches of different fork blocks', () => {
  const other = cache({ meta: { block_env: { number: '0x1' } } })
  assert.throws(() => mergeForkCaches([cache(), other]), /different blocks/)
})

test('round-trips the zstd format that Anvil writes', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'fork-cache-')), 'sepolia', '1', 'storage-ab.json')
  const value = cache({ accounts: { '0xa': { nonce: 1 } } })
  await writeForkCache(path, value)
  assert.deepEqual(await readForkCache(path), value)
})
