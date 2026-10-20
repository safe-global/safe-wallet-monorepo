import { ContractFactory, NonceManager } from 'ethers'
import { createSafe } from './safe.mjs'
import { trustToken } from './tokens.mjs'
import { registerContract } from './contracts.mjs'
import { waitUntil } from './indexing.mjs'
import { erc721Artifact } from './chain.mjs'

export async function prepareNftsScenario(env, owners) {
  const contexts = []
  try {
    const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
    contexts.push(context)
    const signer = new NonceManager(context.signer)
    const cats = await new ContractFactory(erc721Artifact.abi, erc721Artifact.bytecode, signer).deploy(
      'CatFactory',
      'CF',
      '',
    )
    await cats.waitForDeployment()
    for (let id = 0; id < 10; id++) await (await cats.mint(context.safeAddress)).wait()
    const catAddress = await cats.getAddress()
    await waitUntil(
      env,
      `${env.SAFE_TXS_BASE_URL}/v2/safes/${context.safeAddress}/collectibles/?trusted=false`,
      (collectibles) => collectibles.results.filter((item) => item.address === catAddress).length === 10,
    )
    await trustToken(env, catAddress)
    await registerContract(env, {
      address: catAddress,
      chainId: context.chainId,
      name: 'CatFactory',
      abi: erc721Artifact.abi,
    })
    await waitUntil(
      env,
      `${env.SAFE_CGW_BASE_URL}/v2/chains/${context.chainId}/safes/${context.safeAddress}/collectibles`,
      (collectibles) => collectibles.results.length === 10,
    )
    return {
      safes: { static: { SEP_STATIC_SAFE_2: `sep:${context.safeAddress}` } },
    }
  } finally {
    for (const context of contexts) context.provider.destroy()
  }
}
