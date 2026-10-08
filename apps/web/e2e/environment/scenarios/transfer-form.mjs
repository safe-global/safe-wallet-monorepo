import { createSafe, executeTransaction } from './safe.mjs'
import { ensFixtureFiles } from './ens.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { waitUntil } from './indexing.mjs'

// The create transaction specs sign and execute on these staging Safes as OWNER_4.
export async function prepareTransactionCreationScenario(env, owners) {
  return {
    safes: { static: await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_6', 'MATIC_STATIC_SAFE_28']) },
  }
}

export async function prepareTransferFormScenario(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    for (let nonce = 0; nonce < 5; nonce++) {
      const transaction = await context.safe.createTransaction({
        transactions: [{ to: owners.owner1.address, value: '1', data: '0x' }],
        options: { nonce },
      })
      await executeTransaction(context, transaction, { waitForIndexing: false })
    }
    await waitUntil(env, context.path, (safe) => safe.nonce === 5)
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_6: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_10: `sep:${context.safeAddress}`,
        },
      },
      files: await ensFixtureFiles(context.safeAddress),
    }
  } finally {
    context.provider.destroy()
  }
}
