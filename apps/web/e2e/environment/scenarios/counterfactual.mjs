import Safe from '@safe-global/protocol-kit'
import { hexlify, randomBytes } from 'ethers'
import { localProvider } from './provider.mjs'
import { FUNDED_BALANCE, SEPOLIA } from './chain.mjs'

export async function prepareCounterfactualScenario(env, owners) {
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    if ((await provider.getNetwork()).chainId !== BigInt(SEPOLIA)) throw new Error('Expected the Sepolia fork')
    await provider.send('anvil_setBalance', [owners.owner2.address, FUNDED_BALANCE])
    const props = {
      safeAccountConfig: { owners: [owners.owner2.address], threshold: 1 },
      safeDeploymentConfig: { safeVersion: '1.4.1', saltNonce: BigInt(hexlify(randomBytes(16))).toString() },
    }
    const sdk = await Safe.init({
      provider: env.SAFE_RPC_URL,
      signer: owners.owner2.privateKey,
      isL1SafeSingleton: false,
      predictedSafe: props,
    })
    const address = await sdk.getAddress()
    if ((await provider.getCode(address)) !== '0x') throw new Error('Counterfactual scenario must remain undeployed')
    const undeployedSafe = {
      [SEPOLIA]: { [address]: { props, status: { status: 'AWAITING_EXECUTION', type: 'PayLater' } } },
    }
    return {
      fixtures: { undeployedSafes: undeployedSafe },
      safes: { static: { SEP_STATIC_SAFE_0: `sep:${address}` } },
    }
  } finally {
    provider.destroy()
  }
}
