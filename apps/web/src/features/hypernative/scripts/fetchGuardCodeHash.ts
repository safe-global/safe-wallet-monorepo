/**
 * Script to fetch and hash the HypernativeGuard contract bytecode
 *
 * Usage:
 * node -r ts-node/register src/features/hypernative/scripts/fetchGuardCodeHash.ts
 *
 * Or use the npm script approach from the project root
 */

import { JsonRpcProvider, keccak256 } from 'ethers'

const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY' // Replace with actual key
const HYPERNATIVE_GUARD_SEPOLIA = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'

async function fetchGuardCodeHash(rpcUrl: string, contractAddress: string): Promise<string> {
  const provider = new JsonRpcProvider(rpcUrl)
  const code = await provider.getCode(contractAddress)

  if (!code || code === '0x') {
    throw new Error(`No bytecode found at ${contractAddress}`)
  }

  const codeHash = keccak256(code)
  return codeHash
}

async function main() {
  console.log('Fetching HypernativeGuard bytecode from Sepolia...')
  console.log(`Contract address: ${HYPERNATIVE_GUARD_SEPOLIA}`)

  try {
    const hash = await fetchGuardCodeHash(SEPOLIA_RPC, HYPERNATIVE_GUARD_SEPOLIA)
    console.log('\n✅ Code hash:')
    console.log(hash)
    console.log('\nAdd this hash to HYPERNATIVE_GUARD_CODE_HASHES in hypernativeGuardCheck.ts:')
    console.log(`'11155111': ['${hash}'],`)
  } catch (error) {
    console.error('❌ Error fetching code hash:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { fetchGuardCodeHash }
