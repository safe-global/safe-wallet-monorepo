import Safe from '@safe-global/protocol-kit'
import { Interface } from 'ethers'
import { createSafe, proposeTransaction } from './safe.mjs'
import { multiSend, send, waitForNextSecond } from './chain.mjs'
import { buildSwapSettlementSafe } from './cow.mjs'
import { registerToken } from './tokens.mjs'
import { waitForQueued, waitUntil } from './indexing.mjs'

// A staging owner without a test wallet; it only appears as an added or removed owner.
const otherOwner = '0x9445deb174C1eCbbfce8d31D33F438B8e7a0F1BA'
const incomingSender = '0x984370dD2461f0048Cb6A3DA65A16A4822cC097E'
const weth = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
const wethDeposit = { to: weth, value: '100000000000000', data: '0xd0e30db0' }
const safeInterface = new Interface([
  'function execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes) returns (bool)',
])

// Staging OWNER_4 and OWNER_1 own both funds Safes with a threshold of 2.
async function createFundsSafe(env, owners) {
  const context = await createSafe(env, owners, {
    ownerAddresses: [owners.owner4.address, owners.owner1.address],
    threshold: 2,
  })
  const owner1 = await Safe.init({
    provider: env.SAFE_RPC_URL,
    signer: owners.owner1.privateKey,
    safeAddress: context.safeAddress,
  })
  context.signers = {
    owner4: { sdk: context.safe, address: owners.owner4.address },
    owner1: { sdk: owner1, address: owners.owner1.address },
  }
  return context
}

const transfer = (context, value) => (nonce) =>
  context.safe.createTransaction({
    transactions: [{ to: context.signers.owner4.address, value, data: '0x' }],
    options: { nonce },
  })
const call = (context, transaction) => (nonce) =>
  context.safe.createTransaction({ transactions: [transaction], options: { nonce } })

async function sign(create, nonce, signers) {
  let transaction = await create(nonce)
  for (const { sdk } of signers) transaction = await sdk.signTransaction(transaction)
  return transaction
}

// Each execution gets its own block time, so the history lists them in staging order.
async function settled(context, receipt) {
  if (receipt?.status !== 1) throw new Error('Funds Safe setup transaction failed')
  await waitForNextSecond(context.provider, (await context.provider.getBlock(receipt.blockNumber)).timestamp)
}

async function execute(context, transaction) {
  const execution = await context.safe.executeTransaction(transaction)
  await settled(context, await context.provider.waitForTransaction(execution.hash, 1, 60_000))
}

// Executes several signed transactions in one MultiSendCallOnly call, as the wallet's bulk execution does.
async function executeBulk(context, transactions) {
  const calls = transactions.map((transaction) => {
    const { to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver } = transaction.data
    const execData = safeInterface.encodeFunctionData('execTransaction', [
      ...[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver],
      transaction.encodedSignatures(),
    ])
    return { to: context.safeAddress, data: execData }
  })
  // The wallet calls MultiSendCallOnly directly from the executing owner, not through the Safe.
  const { to, data } = multiSend(calls)
  const execution = await context.signer.sendTransaction({ to, data })
  await settled(context, await execution.wait())
}

async function propose(context, transaction, [proposer, ...confirmers]) {
  const { hash } = await proposeTransaction(context, transaction, {
    proposer: { safe: proposer.sdk, signer: proposer },
  })
  for (const { sdk } of confirmers) await context.api.confirmTransaction(hash, (await sdk.signHash(hash)).data)
  return hash
}

async function waitForQueue(context, nonce, hashes) {
  await waitUntil(context.env, context.path, (safe) => safe.nonce === nonce)
  await waitForQueued(context.env, context, hashes)
}

// Staging SEP_FUNDS_SAFE_14: ten executed transactions, the last six in two bulk executions, and a queue.
async function prepareBulkSafe(env, owners) {
  const context = await createFundsSafe(env, owners)
  try {
    const { owner4, owner1 } = context.signers
    const both = [owner4, owner1]
    await execute(context, await sign(transfer(context, '100000000000000'), 0, both))
    const removeOther = (nonce) =>
      context.safe.createRemoveOwnerTx({ ownerAddress: owner1.address, threshold: 1 }, { nonce })
    await execute(context, await sign(removeOther, 1, [owner1, owner4]))
    const addOther = (nonce) => context.safe.createAddOwnerTx({ ownerAddress: owner1.address, threshold: 2 }, { nonce })
    await execute(context, await sign(addOther, 2, [owner4]))
    await execute(context, await sign(transfer(context, '100000000000000'), 3, both))
    await executeBulk(context, [
      await sign(call(context, wethDeposit), 4, both),
      await sign(transfer(context, '200000000000000'), 5, both),
      await sign(transfer(context, '100000000000000'), 6, both),
    ])
    const addOwner = (nonce) => context.safe.createAddOwnerTx({ ownerAddress: otherOwner, threshold: 2 }, { nonce })
    await executeBulk(context, [
      await sign(transfer(context, '10000000000000'), 7, both),
      await sign(addOwner, 8, both),
      await sign(call(context, wethDeposit), 9, both),
    ])
    await send(context.provider, incomingSender, { to: context.safeAddress, value: 990000000000000n })
    const removeOwner = (nonce) =>
      context.safe.createRemoveOwnerTx({ ownerAddress: otherOwner, threshold: 2 }, { nonce })
    const hashes = [
      await propose(context, await transfer(context, '100000000000000')(10), both),
      await propose(context, await removeOwner(11), both),
      await propose(context, await call(context, wethDeposit)(12), [owner1]),
    ]
    await waitForQueue(context, 10, hashes)
    return context.safeAddress
  } finally {
    context.provider.destroy()
  }
}

// Staging SEP_FUNDS_SAFE_15: one executed transfer, a partly signed Next transaction and a signed one after it.
async function preparePartlySignedSafe(env, owners) {
  const context = await createFundsSafe(env, owners)
  try {
    const { owner4, owner1 } = context.signers
    await execute(context, await sign(transfer(context, '10000000000000'), 0, [owner4, owner1]))
    const addOwner = (nonce) => context.safe.createAddOwnerTx({ ownerAddress: otherOwner, threshold: 2 }, { nonce })
    const hashes = [
      await propose(context, await addOwner(1), [owner1]),
      await propose(context, await transfer(context, '1000000000000')(2), [owner4, owner1]),
    ]
    await waitForQueue(context, 1, hashes)
    return context.safeAddress
  } finally {
    context.provider.destroy()
  }
}

/** Rebuilds the staging funds Safes of the bulk execution spec and SEP_STATIC_SAFE_1's swap settlement. */
export async function prepareBulkExecutionScenario(env, owners) {
  // The deposits emit no Transfer, so TXS would not learn the token name that the history shows for WETH.
  await registerToken(env, { address: weth, name: 'Wrapped Ether', symbol: 'WETH', decimals: 18 })
  return {
    safes: {
      funds: {
        SEP_FUNDS_SAFE_14: `sep:${await prepareBulkSafe(env, owners)}`,
        SEP_FUNDS_SAFE_15: `sep:${await preparePartlySignedSafe(env, owners)}`,
      },
      static: { SEP_STATIC_SAFE_1: `sep:${await buildSwapSettlementSafe(env, owners)}` },
    },
  }
}
