import { Contract } from 'ethers'
import { localProvider } from '../../environment/scenarios/provider.mjs'
import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

// EIP-1271: the value that a contract returns when the signature is valid for the hash.
const ERC1271_MAGIC_VALUE = '0x1626ba7e'
const ERC1271_ABI = ['function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)']

/** Whether the Safe contract accepts `signature` for `hash` on the local fork (EIP-1271). */
export async function isValidSafeSignature(
  env: JourneyEnvironment,
  { safeAddress, hash, signature }: { safeAddress: string; hash: string; signature: string },
): Promise<boolean> {
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    const result: unknown = await new Contract(safeAddress, ERC1271_ABI, provider).getFunction('isValidSignature')(
      hash,
      signature,
    )
    return result === ERC1271_MAGIC_VALUE
  } finally {
    provider.destroy()
  }
}

const APPROVED_HASHES_ABI = ['function approvedHashes(address owner, bytes32 hash) view returns (uint256)']

/** Whether `owner` approved `hash` on the Safe through `approveHash`, on the local fork. */
export function isApprovedHash(
  env: JourneyEnvironment,
  { safeAddress, owner, hash }: { safeAddress: string; owner: string; hash: string },
): Promise<boolean> {
  return readChain(env, async (provider) => {
    const approval: unknown = await new Contract(safeAddress, APPROVED_HASHES_ABI, provider).getFunction(
      'approvedHashes',
    )(owner, hash)
    if (typeof approval !== 'bigint') throw new Error(`approvedHashes(${owner}, ${hash}) did not return a uint256`)
    return approval === 1n
  })
}
