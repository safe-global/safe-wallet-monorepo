import { readFile } from 'node:fs/promises'
import { prepareAssetsScenario } from './assets.mjs'
import { prepareBasicScenario } from './basic.mjs'
import { openSafe, proposeTransaction } from './safe.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { waitForQueued } from './indexing.mjs'
import { addressOf, SEPOLIA, short } from './chain.mjs'

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
