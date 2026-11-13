/**
 * Runs once after Anvil starts: moves the fork's clock to now without changing the fork block, and removes the
 * code of the system contracts that would otherwise fetch new storage from the archive RPC on every block.
 */
import { isMain, postJson, requiredEnv } from './http.ts'

// EIP-4788 beacon roots and EIP-2935 block hashes. Each mined block writes new slots of both contracts, which a fork
// fetches from the archive RPC first. Without code the system calls do nothing; BLOCKHASH does not use the contract.
export const SYSTEM_CONTRACTS = [
  '0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02',
  '0x0000F90827F1C53a10cb7A02335B175320002935',
]

export type Rpc = (method: string, params: unknown[]) => Promise<unknown>
type Block = { hash: string; timestamp: string }

async function block(rpc: Rpc, number: string): Promise<Block> {
  return (await rpc('eth_getBlockByNumber', [number, false])) as Block
}

export type Fork = { chainId: number; forkBlock: number; forkHash: string; now: number }

export async function alignForkClock(rpc: Rpc, { chainId, forkBlock, forkHash, now }: Fork): Promise<void> {
  if (
    !String(await rpc('web3_clientVersion', []))
      .toLowerCase()
      .includes('anvil')
  ) {
    throw new Error('Clock alignment requires Anvil')
  }
  if (parseInt(String(await rpc('eth_chainId', [])), 16) !== chainId) {
    throw new Error('Anvil chain ID does not match the fork')
  }
  const anchorNumber = `0x${forkBlock.toString(16)}`
  const anchor = await block(rpc, anchorNumber)
  if (forkHash && anchor.hash.toLowerCase() !== forkHash.toLowerCase()) throw new Error('Fork block hash mismatch')
  if (parseInt((await block(rpc, 'latest')).timestamp, 16) >= now) return
  await rpc('evm_setNextBlockTimestamp', [now])
  await rpc('evm_mine', [])
  if (parseInt((await block(rpc, 'latest')).timestamp, 16) < now) throw new Error('Anvil clock did not advance')
  if ((await block(rpc, anchorNumber)).hash !== anchor.hash) throw new Error('Clock alignment changed the fork anchor')
}

export async function disableSystemContracts(rpc: Rpc): Promise<void> {
  for (const address of SYSTEM_CONTRACTS) await rpc('anvil_setCode', [address, '0x'])
}

if (isMain(import.meta.url)) {
  const url = requiredEnv('ANVIL_RPC_URL')
  const rpc: Rpc = async (method, params) => {
    const answer = (await postJson(url, { jsonrpc: '2.0', id: 1, method, params }, 30_000)) as {
      result?: unknown
      error?: unknown
    }
    if (answer.error) throw new Error(`Anvil clock RPC failed: ${method}`)
    return answer.result
  }
  await alignForkClock(rpc, {
    chainId: Number(requiredEnv('FORK_CHAIN_ID')),
    forkBlock: Number(requiredEnv('FORK_BLOCK_NUMBER')),
    forkHash: process.env.FORK_BLOCK_HASH ?? '',
    now: Math.floor(Date.now() / 1000),
  })
  await disableSystemContracts(rpc)
  console.log('Anvil post-fork clock is current; fork anchor preserved; system contracts disabled')
}
