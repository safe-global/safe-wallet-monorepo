import { ContractFactory, NonceManager } from 'ethers'
import { prepareAssetsScenario } from './assets.mjs'
import { registerContract } from './contracts.mjs'
import { createSafe, openSafe, proposeTransaction } from './safe.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { trustToken } from './tokens.mjs'
import { waitForQueued, waitUntil } from './indexing.mjs'
import { addressOf, erc721Artifact, SEPOLIA, short } from './chain.mjs'

// Queues a transfer signed by OWNER_4 only, so the other owners still have to confirm it.
async function queueTransfer(env, owners, safe, nonce) {
  const context = await openSafe(env, owners.owner4, addressOf(safe))
  const transaction = await context.safe.createTransaction({
    transactions: [{ to: owners.owner1.address, value: '1', data: '0x' }],
    options: { nonce },
  })
  const { hash } = await proposeTransaction(context, transaction)
  await waitForQueued(env, context, [hash])
}

export async function prepareSafeSelectorScenario(env, owners) {
  const names = ['SEP_STATIC_SAFE_7', 'SEP_STATIC_SAFE_9', 'SEP_STATIC_SAFE_11']
  const safes = await rebuildStagingSafes(env, owners, names)
  await queueTransfer(env, owners, safes.SEP_STATIC_SAFE_7, 17)
  await queueTransfer(env, owners, safes.SEP_STATIC_SAFE_9, 3)
  return {
    safes: { static: safes },
    fixtures: {
      'sidebar.safe9Short': short(addressOf(safes.SEP_STATIC_SAFE_9)),
      'sidebar.pendingSafeShort': short(addressOf(safes.SEP_STATIC_SAFE_7)),
    },
  }
}

export async function preparePaginationScenario(env, owners) {
  // 27 tokens and the native balance fill the 28 rows the spec pages through.
  const { safes } = await prepareAssetsScenario(env, owners, 27)
  return { safes: { static: {} }, fixtures: { 'pagination.safe': safes.static.SEP_STATIC_SAFE_2 } }
}

async function mintNfts(env, owners, safe, count) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    const signer = new NonceManager(context.signer)
    const nfts = await new ContractFactory(erc721Artifact.abi, erc721Artifact.bytecode, signer).deploy(
      'CatFactory',
      'CF',
      '',
    )
    await nfts.waitForDeployment()
    for (let id = 0; id < count; id++) await (await nfts.mint(addressOf(safe))).wait()
    const address = await nfts.getAddress()
    await trustToken(env, address)
    await registerContract(env, { address, chainId: context.chainId, name: 'CatFactory', abi: erc721Artifact.abi })
    await waitUntil(
      env,
      `${env.SAFE_CGW_BASE_URL}/v2/chains/${SEPOLIA}/safes/${addressOf(safe)}/collectibles`,
      (collectibles) => collectibles.results.length === count,
    )
  } finally {
    context.provider.destroy()
  }
}

/** SEP_STATIC_SAFE_2 holds the spam tokens and ten NFTs. */
export async function prepareAssetsSecondScenario(env, owners) {
  const assets = await prepareAssetsScenario(env, owners)
  await mintNfts(env, owners, assets.safes.static.SEP_STATIC_SAFE_2, 10)
  return { safes: { static: { SEP_STATIC_SAFE_2: assets.safes.static.SEP_STATIC_SAFE_2 } } }
}
