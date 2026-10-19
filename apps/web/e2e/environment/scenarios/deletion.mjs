import { parseEther } from 'ethers'
import { createSafe, proposeTransaction } from './safe.mjs'
import { waitForQueued, waitUntil } from './indexing.mjs'

export async function prepareDeletionScenario(env, owners) {
  // OWNER_3 co-signs on staging but did not propose, so it must not see the delete option.
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address, owners.owner3.address] })
  try {
    const proposals = []
    for (const nonce of [0, 1]) {
      const tx = await context.safe.createTransaction({
        transactions: [{ to: owners.owner1.address, value: parseEther('0.001').toString(), data: '0x' }],
        options: { nonce },
      })
      proposals.push(await proposeTransaction(context, tx))
    }
    await waitForQueued(
      env,
      context,
      proposals.map(({ hash }) => hash),
    )
    await waitUntil(env, `${context.path}/nonces`, (nonces) => nonces.recommendedNonce === 2)
    return {
      safes: { static: { SEP_STATIC_SAFE_7: `sep:${context.safeAddress}` } },
      fixtures: { 'deletion.nextTxToBeExecuted': proposals[1].id, 'deletion.previousTx': proposals[0].id },
    }
  } finally {
    context.provider.destroy()
  }
}
