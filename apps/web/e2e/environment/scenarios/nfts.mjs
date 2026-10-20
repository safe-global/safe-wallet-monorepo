import { ContractFactory, NonceManager } from 'ethers'
import { createSafe } from './safe.mjs'
import { trustToken } from './tokens.mjs'
import { registerContract } from './contracts.mjs'
import { waitUntil } from './indexing.mjs'
import { erc721Artifact, short } from './chain.mjs'

export async function prepareNftsScenario(env, owners) {
  const contexts = []
  try {
    for (const owner of [owners.owner4.address, owners.owner1.address]) {
      contexts.push(await createSafe(env, owners, { ownerAddresses: [owner], threshold: 1 }))
    }
    const [context, nonOwner] = contexts
    const signer = new NonceManager(context.signer)
    const cats = await new ContractFactory(erc721Artifact.abi, erc721Artifact.bytecode, signer).deploy(
      'CatFactory',
      'CF',
      '',
    )
    await cats.waitForDeployment()
    for (let id = 0; id < 10; id++) await (await cats.mint(context.safeAddress)).wait()
    await (await cats.mint(nonOwner.safeAddress)).wait()
    const catAddress = await cats.getAddress()
    for (const [safe, address, count] of [
      [context, catAddress, 10],
      [nonOwner, catAddress, 1],
    ]) {
      await waitUntil(
        env,
        `${env.SAFE_TXS_BASE_URL}/v2/safes/${safe.safeAddress}/collectibles/?trusted=false`,
        (collectibles) => collectibles.results.filter((item) => item.address === address).length === count,
      )
    }
    await trustToken(env, catAddress)
    await registerContract(env, {
      address: catAddress,
      chainId: context.chainId,
      name: 'CatFactory',
      abi: erc721Artifact.abi,
    })
    for (const [safe, count] of [
      [context, 10],
      [nonOwner, 1],
    ]) {
      await waitUntil(
        env,
        `${env.SAFE_CGW_BASE_URL}/v2/chains/${context.chainId}/safes/${safe.safeAddress}/collectibles`,
        (collectibles) => collectibles.results.length === count,
      )
    }
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_2: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_23: `sep:${context.safeAddress}`,
        },
        nfts: { SEP_NFT_SAFE_2: `sep:${nonOwner.safeAddress}` },
      },
      fixtures: { 'nfts.address': short(catAddress) },
    }
  } finally {
    for (const context of contexts) context.provider.destroy()
  }
}
