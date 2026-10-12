import { createSafe, executeTransaction, openSafe, proposeTransaction } from './safe.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { waitUntil } from './indexing.mjs'
import { addressOf, SEPOLIA, short } from './chain.mjs'

async function addPendingMessage(env, owners, safe, message) {
  const context = await openSafe(env, owners.owner4, addressOf(safe))
  const signed = await context.safe.signMessage(context.safe.createMessage(message))
  await context.api.addMessage(context.safeAddress, { message, signature: signed.encodedSignatures() })
  await waitUntil(env, `${context.path}/messages`, (result) => result.results.some((item) => item.message === message))
}

// Rebuilds the staging Safes of the notes spec and an executed transfer that carries a note.
export async function prepareNotesScenario(env, owners) {
  const safes = await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_6', 'SEP_STATIC_SAFE_8', 'SEP_STATIC_SAFE_26'])
  await addPendingMessage(env, owners, safes.SEP_STATIC_SAFE_26, 'Test message 2 off-chain')
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    const transaction = await context.safe.createTransaction({
      transactions: [{ to: owners.owner1.address, value: '1', data: '0x' }],
    })
    const { signed, hash } = await proposeTransaction(context, transaction, {
      origin: JSON.stringify({ note: 'Tx note one' }),
    })
    await executeTransaction(context, signed)
    const id = `multisig_${context.safeAddress}_${hash}`
    await waitUntil(
      env,
      `${env.SAFE_CGW_BASE_URL}/v1/chains/${SEPOLIA}/transactions/${id}`,
      (details) => details.note === 'Tx note one' && details.txStatus === 'SUCCESS',
    )
    return {
      safes: { static: safes },
      fixtures: {
        'notes.safe': `sep:${context.safeAddress}`,
        'notes.oneOfoneTx': `&id=${id}`,
        'notes.creator': `sep:${short(owners.owner4.address)}`,
      },
    }
  } finally {
    context.provider.destroy()
  }
}
