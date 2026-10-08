import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { zstdCompressSync, zstdDecompressSync } from 'node:zlib'

/**
 * Merges Anvil fork caches of one fork block. Every value in them is chain state at that block, so the union
 * of accounts, storage slots and block hashes is valid. `meta` comes from the first cache, which must be one
 * that Anvil wrote through the stack's fork proxy.
 */
export function mergeForkCaches([first, ...rest]) {
  const merged = structuredClone(first)
  for (const cache of rest) {
    if (JSON.stringify(cache.meta.block_env) !== JSON.stringify(merged.meta.block_env)) {
      throw new Error('Fork caches of different blocks cannot be merged')
    }
    Object.assign(merged.accounts, cache.accounts)
    Object.assign(merged.block_hashes, cache.block_hashes)
    for (const [address, slots] of Object.entries(cache.storage)) {
      merged.storage[address] = { ...merged.storage[address], ...slots }
    }
  }
  // Each run reads fresh random owners and Safe addresses; their empty accounts would only grow the file.
  for (const [address, account] of Object.entries(merged.accounts)) {
    if (isEmptyAccount(account) && !merged.storage[address]) delete merged.accounts[address]
  }
  // The stack removes the code of these contracts at start (align_fork_clock.py), so nothing reads their storage.
  for (const address of SYSTEM_CONTRACTS) delete merged.storage[address]
  return merged
}

const SYSTEM_CONTRACTS = ['0x000f3df6d732807ef1319fb7b8bb8522d0beac02', '0x0000f90827f1c53a10cb7a02335b175320002935']

const EMPTY_CODE_HASH = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'

const isEmptyAccount = (account) =>
  Number(account.nonce) === 0 && BigInt(account.balance) === 0n && account.code_hash === EMPTY_CODE_HASH

export const readForkCache = async (path) => JSON.parse(zstdDecompressSync(await readFile(path)))

export async function writeForkCache(path, cache) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, zstdCompressSync(JSON.stringify(cache)))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [output, ...inputs] = process.argv.slice(2)
  if (!output || !inputs.length) {
    console.error('Usage: node fork-cache.mjs <output> <proxy cache> [more caches of the same block...]')
    process.exit(1)
  }
  const merged = mergeForkCaches(await Promise.all(inputs.map(readForkCache)))
  await writeForkCache(output, merged)
  const count = (key) => Object.keys(merged[key]).length
  console.log(`Wrote ${output}: ${count('accounts')} accounts, ${count('storage')} contracts with storage`)
}
