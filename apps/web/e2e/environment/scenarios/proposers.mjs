import Safe from '@safe-global/protocol-kit'
import { createSafe, executeTransaction } from './safe.mjs'
import { addDelegateToQueue, proposeToQueue } from './gateway.mjs'
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

async function proposeAsDelegate(env, context, delegate) {
  const delegateSafe = await Safe.init({
    provider: env.SAFE_RPC_URL,
    signer: delegate.privateKey,
    safeAddress: context.safeAddress,
  })
  const transaction = await context.safe.createTransaction({
    transactions: [{ to: delegate.address, value: '1', data: '0x' }],
  })
  const hash = await context.safe.getTransactionHash(transaction)
  await proposeToQueue(context, {
    data: transaction.data,
    hash,
    sender: delegate.address,
    signature: (await delegateSafe.signHash(hash)).data,
  })
  const id = `multisig_${context.safeAddress}_${hash}`
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v1/chains/${context.chainId}/transactions/${id}`,
    (detail) => detail.txStatus === 'AWAITING_CONFIRMATIONS',
  )
  return `&id=${id}`
}

// Rebuilds the staging proposer Safes: OWNER_3 co-owns S31/S33, OWNER_1 is the delegate.
export async function prepareProposersScenario(env, owners) {
  const contexts = []
  try {
    const shared = { ownerAddresses: [owners.owner3.address, owners.owner4.address], threshold: 1 }
    const proposals = await createSafe(env, owners, shared)
    contexts.push(proposals)
    await executeOnce(proposals, owners)
    await addDelegates(env, proposals, stagingProposers(owners))
    const proposedTx = await proposeAsDelegate(env, proposals, owners.owner1)
    const nested = await createSafe(env, owners, shared)
    contexts.push(nested)
    await executeOnce(nested, owners)
    await addDelegates(env, nested, [
      { delegate: owners.owner1.address, delegator: owners.owner4, label: 'Proposer 1' },
      { delegate: proposals.safeAddress, delegator: owners.owner4, label: 'Safe proposer' },
    ])
    const single = { ownerAddresses: [owners.owner4.address], threshold: 1 }
    const empty = await createSafe(env, owners, single)
    contexts.push(empty)
    const payouts = await createSafe(env, owners, single)
    contexts.push(payouts)
    await addDelegates(env, payouts, [
      { delegate: owners.owner1.address, delegator: owners.owner4, label: 'Test proposer' },
    ])
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_31: `sep:${proposals.safeAddress}`,
          SEP_STATIC_SAFE_32: `sep:${empty.safeAddress}`,
          SEP_STATIC_SAFE_33: `sep:${nested.safeAddress}`,
          SEP_STATIC_SAFE_42: `sep:${payouts.safeAddress}`,
        },
      },
      fixtures: {
        'proposers.creator': `sep:${short(owners.owner4.address)}`,
        'proposers.delegate': short(owners.owner1.address),
        'proposers.safeDelegate': short(proposals.safeAddress),
        'proposers.proposedTx': proposedTx,
        'proposers.addressBook': {
          [SEPOLIA]: { [owners.owner4.address]: 'AD Proposer1', [owners.owner1.address]: 'AD Proposer2' },
        },
      },
    }
  } finally {
    for (const context of contexts) context.provider.destroy()
  }
}
