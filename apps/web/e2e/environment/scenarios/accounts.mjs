import { readFile } from 'node:fs/promises'
import { ContractFactory, NonceManager } from 'ethers'
import { prepareAssetsScenario } from './assets.mjs'
import { prepareBasicScenario } from './basic.mjs'
import { registerContract } from './contracts.mjs'
import { setEnsName } from './ens.mjs'
import { addDelegates } from './proposers.mjs'
import { createSafe, openSafe, proposeTransaction, safeService } from './safe.mjs'
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

// OWNER_4 and OWNER_1 propose for SEP_STATIC_SAFE_31, as on staging.
async function addStagingProposers(env, owners, safe) {
  await addDelegates(env, safeService(env, addressOf(safe)), [
    { delegate: owners.owner4.address, delegator: owners.owner4, label: 'Proposer 1' },
    { delegate: owners.owner1.address, delegator: owners.owner3, label: 'Proposer 2' },
  ])
}

async function transactionBuilderId(env) {
  const response = await fetch(`${env.SAFE_CGW_BASE_URL}/v1/chains/${SEPOLIA}/safe-apps`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Local Safe Apps catalog returned ${response.status}`)
  const builder = (await response.json()).find((app) => app.name === 'Transaction Builder')
  if (!builder) throw new Error('The local config service has no Transaction Builder app to pin')
  return builder.id
}

/** Pins the local Transaction Builder in the imported file and stored apps instead of the staging app id. */
export async function prepareImportDataScenario(env, owners) {
  const scenario = await prepareBasicScenario(env, owners)
  const builderId = await transactionBuilderId(env)
  const name = 'data_import.json'
  const imported = JSON.parse(await readFile(new URL(`../../../cypress/fixtures/${name}`, import.meta.url), 'utf8'))
  imported.data.safeApps[SEPOLIA].pinned = [builderId]
  return {
    ...scenario,
    fixtures: { 'pinnedApps.transactionBuilder': { [SEPOLIA]: { pinned: [builderId], opened: [] } } },
    files: { [name]: imported },
  }
}

export async function prepareLoadSafeScenario(env, owners) {
  await setEnsName(env, 'testenssepolia.eth', owners.owner4.address)
  const names = ['SEP_STATIC_SAFE_3', 'SEP_STATIC_SAFE_4', 'SEP_STATIC_SAFE_13']
  // Only the Ethereum owner-name case needs the mainnet fork, so the other cases still run without it.
  const funds = env.SAFE_E2E_CHAINS?.[1] ? await rebuildStagingSafes(env, owners, ['ETH_FUNDS_SAFE_13']) : {}
  return { safes: { static: await rebuildStagingSafes(env, owners, names), funds } }
}

export async function prepareSafeSelectorScenario(env, owners) {
  const names = ['SEP_STATIC_SAFE_7', 'SEP_STATIC_SAFE_9', 'SEP_STATIC_SAFE_11', 'SEP_STATIC_SAFE_31']
  const safes = await rebuildStagingSafes(env, owners, names)
  await queueTransfer(env, owners, safes.SEP_STATIC_SAFE_7, 17)
  await queueTransfer(env, owners, safes.SEP_STATIC_SAFE_9, 3)
  await addStagingProposers(env, owners, safes.SEP_STATIC_SAFE_31)
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

/** SEP_STATIC_SAFE_2 holds the spam tokens and ten NFTs, S31 has OWNER_1 as proposer, S8 a spending limit. */
export async function prepareAssetsSecondScenario(env, owners) {
  const assets = await prepareAssetsScenario(env, owners)
  await mintNfts(env, owners, assets.safes.static.SEP_STATIC_SAFE_2, 10)
  const safes = await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_8', 'SEP_STATIC_SAFE_31'])
  await addStagingProposers(env, owners, safes.SEP_STATIC_SAFE_31)
  return { safes: { static: { ...safes, SEP_STATIC_SAFE_2: assets.safes.static.SEP_STATIC_SAFE_2 } } }
}
