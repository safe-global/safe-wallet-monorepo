import Safe from '@safe-global/protocol-kit'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { createSafe, executeTransaction } from './safe.mjs'
import { waitUntil } from './indexing.mjs'
import { SEPOLIA, short } from './chain.mjs'

export async function addDelegates(env, context, delegates) {
  for (const { delegate, delegator, label } of delegates) {
    await context.api.addSafeDelegate({
      safeAddress: context.safeAddress,
      delegateAddress: delegate,
      delegatorAddress: delegator.address,
      signer: createWalletClient({
        account: privateKeyToAccount(delegator.privateKey),
        chain: sepolia,
        transport: http(env.SAFE_RPC_URL),
      }),
      label,
    })
  }
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v2/chains/${context.chainId}/delegates?safe=${context.safeAddress}`,
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
  await context.api.proposeTransaction({
    safeAddress: context.safeAddress,
    safeTransactionData: transaction.data,
    safeTxHash: hash,
    senderAddress: delegate.address,
    senderSignature: (await delegateSafe.signHash(hash)).data,
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
    await addDelegates(env, proposals, [
      { delegate: owners.owner4.address, delegator: owners.owner4, label: 'Proposer 1' },
      { delegate: owners.owner1.address, delegator: owners.owner3, label: 'Proposer 2' },
    ])
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
