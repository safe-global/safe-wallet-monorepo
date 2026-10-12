import { Wallet, parseEther } from 'ethers'
import { createSafe, executeTransaction, proposeTransaction } from './safe.mjs'
import { waitForQueued } from './indexing.mjs'

export async function prepareRejectionScenario(env, owners) {
  const queue = await createSafe(env, owners, {
    ownerAddresses: [owners.owner4.address, Wallet.createRandom().address],
  })
  let rejections
  try {
    const transfer = await proposeTransaction(
      queue,
      await queue.safe.createTransaction({
        transactions: [{ to: owners.owner1.address, value: parseEther('0.001').toString(), data: '0x' }],
        options: { nonce: 0 },
      }),
    )
    await waitForQueued(env, queue, [transfer.hash])
    rejections = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
    const executed = await proposeTransaction(rejections, await rejections.safe.createRejectionTransaction(0))
    await executeTransaction(rejections, executed.signed)
    const pending = await proposeTransaction(rejections, await rejections.safe.createRejectionTransaction(1))
    await waitForQueued(env, rejections, [pending.hash])
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_34: `sep:${queue.safeAddress}`,
          SEP_STATIC_SAFE_7: `sep:${rejections.safeAddress}`,
          SEP_STATIC_SAFE_37: `sep:${rejections.safeAddress}`,
        },
      },
      fixtures: {
        'swaps.sellQLimitOrder': transfer.id,
        'rejection.executed': executed.id,
        'rejection.pending': pending.id,
      },
    }
  } finally {
    queue.provider.destroy()
    rejections?.provider.destroy()
  }
}
