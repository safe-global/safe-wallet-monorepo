import { createSafe, executeTransaction } from './safe.mjs'
import { waitUntil } from './indexing.mjs'

export async function prepareTransferFormScenario(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.alice.address], threshold: 1 })
  try {
    for (let nonce = 0; nonce < 5; nonce++) {
      const transaction = await context.safe.createTransaction({
        transactions: [{ to: owners.bob.address, value: '1', data: '0x' }],
        options: { nonce },
      })
      await executeTransaction(context, transaction, { waitForIndexing: false })
    }
    await waitUntil(env, context.path, (safe) => safe.nonce === 5)
    return { safes: { transferForm: `sep:${context.safeAddress}` } }
  } finally {
    context.provider.destroy()
  }
}
