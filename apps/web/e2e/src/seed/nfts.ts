import { ContractFactory, NonceManager } from 'ethers'
import { erc721Artifact } from '../../environment/scenarios/chain.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { trustToken } from '../../environment/scenarios/tokens.mjs'
import { readChain } from '../chain/local-provider'
import type { CollectiblePage } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import type { SeededSafe } from './safe'

export type SeededNfts = {
  contract: string
  tokenIds: string[]
}

async function mintCatFactory(safe: SeededSafe, count: number): Promise<SeededNfts> {
  const { env, signer } = safe.context
  return readChain(env, async (provider) => {
    const minter = new NonceManager(signer.connect(provider))
    const factory = new ContractFactory(erc721Artifact.abi, erc721Artifact.bytecode, minter)
    const cats = await factory.deploy('CatFactory', 'CF', '')
    await cats.waitForDeployment()
    const tokenIds = Array.from({ length: count }, (_, id) => String(id))
    for (let minted = 0; minted < count; minted++) await (await cats.getFunction('mint')(safe.address)).wait()
    return { contract: await cats.getAddress(), tokenIds }
  })
}

const listsAll =
  ({ contract, tokenIds }: SeededNfts) =>
  (collectibles: CollectiblePage) =>
    collectibles.results.filter(({ address }) => address === contract).length === tokenIds.length

/** Mints `count` CatFactory NFTs (IDs from 0) to the Safe, trusts the token, and waits until CGW lists them. */
export async function seedNfts(safe: SeededSafe, { count }: { count: number }): Promise<SeededNfts> {
  const { env, chainId } = safe.context
  const nfts = await mintCatFactory(safe, count)
  // CGW caches its first answer, so wait for the indexer before CGW is asked.
  await waitUntil(env, `${env.SAFE_TXS_BASE_URL}/v2/safes/${safe.address}/collectibles/?trusted=false`, listsAll(nfts))
  await trustToken(env, nfts.contract)
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v2/chains/${chainId}/safes/${safe.address}/collectibles`,
    listsAll(nfts),
  )
  return nfts
}
