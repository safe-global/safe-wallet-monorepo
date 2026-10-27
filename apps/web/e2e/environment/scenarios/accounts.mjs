import { openSafe, proposeTransaction } from './safe.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { waitForQueued } from './indexing.mjs'
import { addressOf, short } from './chain.mjs'

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
