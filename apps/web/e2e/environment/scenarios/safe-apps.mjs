import { Interface } from 'ethers'
import { getSafeL2SingletonDeployment } from '@safe-global/safe-deployments'
import { registerContract } from './contracts.mjs'
import { rebuildStagingSafe } from './staging.mjs'
import { stagingSafeAppSafes } from './staging-safes.mjs'
import { localProvider } from './provider.mjs'
import { SEPOLIA } from './chain.mjs'

const chainId = SEPOLIA
export const basicTypesTestContract = '0x11AB70A4564C62F567B92868Cb5e69b50c5434aF'
// The staging recipient Safe is only typed into the builder as an address, and the fork holds its contract.
const stagingRecipientSafe = '0x4DD4cB2299E491E1B469245DB589ccB2B16d7bde'

async function assertForkContract(env, address) {
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    if ((await provider.getCode(address)) === '0x') throw new Error(`The fork has no contract at ${address}`)
  } finally {
    provider.destroy()
  }
}

// Transaction Builder reads ABIs only from the local CGW: the test contract and the Safe implementations.
export async function registerBuilderContracts(env) {
  await assertForkContract(env, basicTypesTestContract)
  await registerContract(env, {
    address: basicTypesTestContract,
    chainId,
    name: 'BasicTypesTestContract',
    abi: JSON.parse(
      new Interface([
        'function testAddressValue(address newValue)',
        'function testBooleanValue(bool newValue)',
      ]).formatJson(),
    ),
  })
  for (const version of ['1.3.0', '1.4.1']) {
    const singleton = getSafeL2SingletonDeployment({ version, network: String(chainId) })
    await registerContract(env, {
      address: singleton.networkAddresses[chainId],
      chainId,
      name: `SafeL2 ${version}`,
      abi: singleton.abi,
    })
  }
}

/** The staging Safe App Safes, used by Transaction Builder and Drain Account. */
export async function prepareSafeAppSafesScenario(env, owners) {
  await registerBuilderContracts(env)
  await assertForkContract(env, stagingRecipientSafe)
  const safe = await rebuildStagingSafe(env, owners, stagingSafeAppSafes.SEP_SAFEAPP_SAFE_1)
  return {
    safes: { safeapps: { SEP_SAFEAPP_SAFE_1: `sep:${safe}`, SEP_SAFEAPP_SAFE_2: `sep:${stagingRecipientSafe}` } },
  }
}
