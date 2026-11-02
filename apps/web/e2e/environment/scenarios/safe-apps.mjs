import { Interface } from 'ethers'
import { getSafeL2SingletonDeployment } from '@safe-global/safe-deployments'
import { registerContract } from './contracts.mjs'
import { localProvider } from './provider.mjs'
import { SEPOLIA } from './chain.mjs'

const chainId = SEPOLIA
export const basicTypesTestContract = '0x11AB70A4564C62F567B92868Cb5e69b50c5434aF'

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
