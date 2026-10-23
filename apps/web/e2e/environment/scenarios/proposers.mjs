import { createSafe, executeTransaction } from './safe.mjs'
import { addDelegateToQueue } from './gateway.mjs'
import { waitUntil } from './indexing.mjs'
import { SEPOLIA, short } from './chain.mjs'

/**
 * The proposers of staging SEP_STATIC_SAFE_31. The Queue Service refuses a delegate that is its own delegator, so
 * OWNER_3 adds OWNER_4 (staging: OWNER_4 itself) and OWNER_4 adds OWNER_1; OWNER_4 stays a proposer and a creator.
 * The Queue Service lists the newest first and the specs find a row by the first address match, so OWNER_4 is last.
 */
export const stagingProposers = (owners) => [
  { delegate: owners.owner1.address, delegator: owners.owner4, label: 'Proposer 2' },
  { delegate: owners.owner4.address, delegator: owners.owner3, label: 'Proposer 1' },
]

export async function addDelegates(env, context, delegates) {
  for (const delegate of delegates) await addDelegateToQueue(context, delegate)
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v3/chains/${context.chainId}/delegates?safe=${context.safeAddress}`,
    (result) => result.results?.length === delegates.length,
  )
}

async function executeOnce(context, owners) {
  const transaction = await context.safe.createTransaction({
    transactions: [{ to: owners.owner1.address, value: '1', data: '0x' }],
  })
  await executeTransaction(context, await context.safe.signTransaction(transaction))
}

// Rebuilds staging SEP_STATIC_SAFE_31: OWNER_3 and OWNER_4 own it, OWNER_1 and OWNER_4 are its proposers.
export async function prepareProposersScenario(env, owners) {
  const proposals = await createSafe(env, owners, {
    ownerAddresses: [owners.owner3.address, owners.owner4.address],
    threshold: 1,
  })
  try {
    await executeOnce(proposals, owners)
    await addDelegates(env, proposals, stagingProposers(owners))
    return {
      safes: { static: { SEP_STATIC_SAFE_31: `sep:${proposals.safeAddress}` } },
      fixtures: {
        'proposers.creator': `sep:${short(owners.owner4.address)}`,
        'proposers.addressBook': {
          [SEPOLIA]: { [owners.owner4.address]: 'AD Proposer1', [owners.owner1.address]: 'AD Proposer2' },
        },
      },
    }
  } finally {
    proposals.provider.destroy()
  }
}
