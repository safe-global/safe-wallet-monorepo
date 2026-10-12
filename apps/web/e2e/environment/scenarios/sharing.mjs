import Safe from '@safe-global/protocol-kit'
import { parseEther } from 'ethers'
import { createSafe, executeTransaction, proposeTransaction } from './safe.mjs'
import { waitForQueued } from './indexing.mjs'

export async function prepareSharingScenario(env, owners) {
  const context = await createSafe(env, owners)
  try {
    const transactions = [{ to: owners.owner1.address, value: parseEther('0.001').toString(), data: '0x' }]
    const executed = await proposeTransaction(
      context,
      await context.safe.createTransaction({ transactions, options: { nonce: 0 } }),
    )
    const otherOwner = await Safe.init({
      provider: env.SAFE_RPC_URL,
      signer: owners.owner1.privateKey,
      safeAddress: context.safeAddress,
    })
    await executeTransaction(context, await otherOwner.signTransaction(executed.signed))

    const queued = []
    for (const nonce of [1, 2]) {
      queued.push(
        await proposeTransaction(context, await context.safe.createTransaction({ transactions, options: { nonce } })),
      )
    }
    await waitForQueued(
      env,
      context,
      queued.map(({ hash }) => hash),
    )
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_7: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_31: `sep:${context.safeAddress}`,
        },
      },
      fixtures: { 'sharing.tx1': queued[0].id, 'sharing.tx3': queued[1].id, 'sharing.tx4': executed.id },
    }
  } finally {
    context.provider.destroy()
  }
}
