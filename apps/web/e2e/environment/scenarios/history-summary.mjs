import { readFile } from 'node:fs/promises'
import { ContractFactory, NonceManager, ZeroAddress, parseEther } from 'ethers'
import { allowanceCall, allowanceSetupCalls, registerAllowanceModule } from './allowance.mjs'
import { erc20Artifact, send } from './chain.mjs'
import { waitUntil } from './indexing.mjs'
import { createSafe, executeTransaction, proposeTransaction } from './safe.mjs'
import { trustToken } from './tokens.mjs'

const incomingTokens = [
  { symbol: 'QTRUST', amount: '1000', trusted: true },
  { symbol: 'TTONE', amount: '5', trusted: false },
]

/** One incoming transfer per token from the fixture's sender; returns each token with its transfer hash. */
async function receiveTokens(env, context, sender) {
  const deployer = new NonceManager(context.signer)
  const tokens = []
  for (const { symbol, amount, trusted } of incomingTokens) {
    const factory = new ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode, deployer)
    const token = await factory.deploy(`Isolated ${symbol}`, symbol, parseEther(amount), sender)
    await token.waitForDeployment()
    const { hash } = await send(context.provider, sender, {
      to: token.target,
      data: token.interface.encodeFunctionData('transfer', [context.safeAddress, parseEther(amount)]),
    })
    if (trusted) await trustToken(env, token.target)
    tokens.push({ address: token.target, trusted, hash })
  }
  await waitUntil(env, `${env.SAFE_TXS_BASE_URL}/v1/safes/${context.safeAddress}/balances/?trusted=false`, (balances) =>
    tokens.every(({ address }) => balances.some(({ tokenAddress }) => tokenAddress === address)),
  )
  return tokens
}

const asTransactions = (calls) => calls.map(({ to, data }) => ({ to, value: '0', data }))

/** The outgoing history: a transfer, a rejection, a batch, then a spending limit and its removal. */
function outgoingSteps(context, owners) {
  const transfer = { to: owners.owner1.address, value: parseEther('0.0001').toString(), data: '0x' }
  const delegate = owners.owner4.address
  const limit = allowanceSetupCalls(context.safeAddress, [{ delegate, amount: parseEther('0.1') }])
  return [
    () => context.safe.createTransaction({ transactions: [transfer] }),
    () => context.safe.createRejectionTransaction(1),
    () => context.safe.createTransaction({ transactions: [transfer, { ...transfer, to: delegate }] }),
    () => context.safe.createTransaction({ transactions: asTransactions(limit) }),
    () =>
      context.safe.createTransaction({
        transactions: asTransactions([allowanceCall('deleteAllowance', [delegate, ZeroAddress])]),
      }),
  ]
}

async function waitForHistory(env, context, hashes, tokens) {
  await waitUntil(env, `${context.path}/transactions/history?trusted=false`, (history) => {
    const transactions = history.results.flatMap((item) => (item.transaction ? [item.transaction] : []))
    const listsTransfer = (token) =>
      transactions.some((tx) => tx.txHash === token.hash && tx.txInfo.transferInfo?.trusted === token.trusted)
    return hashes.every((hash) => JSON.stringify(transactions).includes(hash)) && tokens.every(listsTransfer)
  })
  const [trusted, untrusted] = tokens
  await waitUntil(env, `${context.path}/transactions/history?trusted=true`, (history) => {
    const text = JSON.stringify(history)
    return text.includes(trusted.hash) && !text.includes(untrusted.hash)
  })
}

export async function prepareHistorySummaryScenario(env, owners) {
  const fixture = JSON.parse(
    await readFile(new URL('../../../cypress/fixtures/txhistory_data_data.json', import.meta.url), 'utf8'),
  )
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    const tokens = await receiveTokens(env, context, fixture.type.receive.senderAddress)
    await registerAllowanceModule(env)
    const hashes = []
    for (const create of outgoingSteps(context, owners)) {
      const proposed = await proposeTransaction(context, await create())
      await executeTransaction(context, proposed.signed, { waitForIndexing: false })
      hashes.push(proposed.hash)
    }
    await waitForHistory(env, context, hashes, tokens)
    const safe = `sep:${context.safeAddress}`
    return { safes: { static: { SEP_STATIC_SAFE_4: safe, SEP_STATIC_SAFE_7: safe, SEP_STATIC_SAFE_23: safe } } }
  } finally {
    context.provider.destroy()
  }
}
