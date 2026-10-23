import { Wallet, parseEther } from 'ethers'
import { createSafe, proposeTransaction } from './safe.mjs'
import { waitForQueued } from './indexing.mjs'

export async function prepareRejectionScenario(env, owners) {
  const queue = await createSafe(env, owners, {
    ownerAddresses: [owners.owner4.address, Wallet.createRandom().address],
  })
  try {
    const transfer = await proposeTransaction(
      queue,
      await queue.safe.createTransaction({
        transactions: [{ to: owners.owner1.address, value: parseEther('0.001').toString(), data: '0x' }],
        options: { nonce: 0 },
      }),
    )
    await waitForQueued(env, queue, [transfer.hash])
    return {
      safes: { static: { SEP_STATIC_SAFE_34: `sep:${queue.safeAddress}` } },
      fixtures: { 'swaps.sellQLimitOrder': transfer.id },
    }
  } finally {
    queue.provider.destroy()
  }
}
