import { readFileSync } from 'node:fs'
import { Contract, Interface, MaxUint256, getAddress, id, parseEther, toQuantity } from 'ethers'
import { registerContracts } from './contracts.mjs'
import { runInLocalService } from './local-service.mjs'
import { createSafe, proposeTransaction } from './safe.mjs'
import { execute, localAddress, stagingOwners } from './staging.mjs'
import { COMPOSABLE_COW, COW, DAI, SETTLEMENT, VAULT_RELAYER } from './cow-protocol.mjs'
import { dealToken, send, SEPOLIA } from './chain.mjs'
import { rebuildStagingSafes, stagingSafes } from './staging-safes.mjs'
import { trustToken } from './tokens.mjs'
import { waitUntil } from './indexing.mjs'

// Staging CoW Protocol transactions; the local CoW API mock (infra/scripts/cow_api.py) serves their orders.
const staging = JSON.parse(readFileSync(new URL('./cow-transactions.json', import.meta.url), 'utf8'))
const recorded = JSON.parse(
  readFileSync(new URL('../infra/scripts/cow_api_orders.json', import.meta.url), 'utf8'),
).orders

const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11'
const { owner4, sepoliaOwner2 } = stagingOwners

// Owners of the non-static staging Safes whose orders the specs open directly.
const orderSafes = {
  '0x8f4A19C85b39032A37f7a6dCc65234f966F72551': {
    owners: [
      '0x7F61C7613204227461779139392De690ddDa6804',
      '0xf7EaD48590C08c8530A228dF57Af916f59566E2E',
      '0x61a0c717d18232711bC788F19C9Cd56a43cc8872',
      '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8',
      '0x564040b901D98838Df5e3FE0529B64F02B2D7937',
      '0x572A48316eb950f0141fbb7652e528347Ef2E9Dd',
      '0x6c15f69EE76DA763e5b5DB6f7f0C29eb625bc9B7',
      '0xb43470d6913f548Bf90E299De2fe3f94140aaf7c',
      '0x543208a929C379f00328b7095314E790338F8F63',
      '0x11B1D54B66e5e226D6f89069c21A569A22D98cfd',
    ],
    threshold: 1,
  },
  '0xF184a243925Bf7fb1D64487339FF4F177Fb75644': { owners: [sepoliaOwner2], threshold: 1 },
  '0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9': {
    owners: [
      '0xCD3794A9404d1C72a24A56CBDfaf912AFF2be5FD',
      '0x72E5187E04BAB54C0e08920A6ebF5128d1c2F215',
      '0x4c3c38a459F0bAABB763290111B66ed01b5fEfA2',
      '0x648B1A369109dcA3fF49A5c5877973309024D2A0',
      '0xd0ba955b8F34561907Abb588603a2400e06BD2d2',
      '0xec7b7F5C0031e6C933931Ade1833aac867c5CD5f',
      '0x448E4E6DD37523A5c7804D75a67754c24bFbFb32',
      '0x65F8236309e5A99Ff0d129d04E486EBCE20DC7B0',
    ],
    threshold: 2,
  },
  '0x140663Cb76e4c4e97621395fc118912fa674150B': {
    owners: ['0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8'],
    threshold: 1,
  },
  '0x03042B890b99552b60A073F808100517fb148F60': stagingSafes.SEP_STATIC_SAFE_1,
  '0xC97FCf0B8890a5a7b1a1490d44Dc9EbE3cE04884': { owners: [owner4], threshold: 1 },
  '0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2': { owners: [owner4, sepoliaOwner2], threshold: 2 },
}

const abi = (fragments) => new Interface(fragments).fragments.map((fragment) => JSON.parse(fragment.format('json')))
const cowContracts = [
  { address: SETTLEMENT, name: 'GPv2Settlement', abi: abi(['function setPreSignature(bytes orderUid, bool signed)']) },
  {
    address: COMPOSABLE_COW,
    name: 'ComposableCoW',
    abi: abi([
      'function createWithContext((address handler, bytes32 salt, bytes staticInput) params, address factory, ' +
        'bytes data, bool dispatch)',
    ]),
  },
  {
    address: COW,
    name: 'CowProtocolToken',
    abi: abi(['function approve(address spender, uint256 amount)', 'function transfer(address to, uint256 amount)']),
  },
  {
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    name: 'WETH9',
    abi: abi(['function deposit() payable', 'function approve(address guy, uint256 wad)']),
  },
]

const erc20 = new Interface([
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
])
const vaultRelayer = new Interface(['function transferFromAccounts((address,address,uint256,bytes32)[])'])
const multicall = new Interface(['function aggregate3((address,bool,bytes)[]) payable returns ((bool,bytes)[])'])

// The Transaction Service only knows tokens it saw in a transfer; recorded orders also trade other tokens.
async function indexOrderTokens(env) {
  const tokens = [...new Set(recorded.flatMap(({ sellToken, buyToken }) => [sellToken, buyToken]))].map(getAddress)
  const script = readFileSync(new URL('./index-tokens.py', import.meta.url), 'utf8')
  await runInLocalService(env, 'txs-web', ['python', 'manage.py', 'shell', '-c', script], JSON.stringify(tokens))
}

async function registerCowContracts(env) {
  await Promise.all([
    registerContracts(
      env,
      cowContracts.map((contract) => ({ ...contract, chainId: SEPOLIA })),
    ),
    // COW can be an order token too, so it is trusted only after the indexing wrote it.
    indexOrderTokens(env).then(() => trustToken(env, COW)),
  ])
}

// The UID of a recorded order placed by the local Safe; the mock finds the order by its validTo.
export function localOrderUid(validTo, safeAddress, orders = recorded) {
  const order = orders.find((candidate) => candidate.validTo === validTo)
  if (!order) throw new Error(`No recorded CoW order has validTo ${validTo}; record it in cow_api_orders.json`)
  const { uid } = order
  return `${uid.slice(0, 66)}${safeAddress.slice(2).toLowerCase()}${uid.slice(-8)}`
}

// The staging transaction as sent from another Safe: the order UIDs and receivers embed the Safe address.
export function replayed(name, safeAddress, transactions = staging) {
  const { safe, to, value, data, operation } = transactions[name]
  return {
    to,
    value,
    data: data.replace(new RegExp(safe.slice(2), 'gi'), safeAddress.slice(2).toLowerCase()),
    operation,
  }
}

async function deploySafe(env, owners, stagingAddress) {
  const { owners: orderOwners, threshold } = orderSafes[stagingAddress]
  const ownerAddresses = orderOwners.map((address) => localAddress(owners, address))
  const context = await createSafe(env, owners, { ownerAddresses, threshold })
  return { ...context, signers: ownerAddresses.slice(0, threshold) }
}

// The gateway derives TWAP part orders from the execution date, so it must match the recorded orders.
const TWAP_ORDERS = ['twapPartial', 'twapFilled', 'safe27Twap']

async function backdateExecution(env, safeTxHash, timestamp) {
  const url = `${env.SAFE_TXS_BASE_URL}/v1/multisig-transactions/${safeTxHash}/`
  await waitUntil(env, url, (transaction) => transaction.isExecuted)
  await runInLocalService(env, 'txs-web', [
    'python',
    'manage.py',
    'shell',
    '-c',
    [
      'from datetime import datetime, timezone',
      'from safe_transaction_service.history.models import MultisigTransaction',
      `block = MultisigTransaction.objects.get(safe_tx_hash="${safeTxHash}").ethereum_tx.block`,
      `block.timestamp = datetime.fromtimestamp(${Number(timestamp)}, timezone.utc)`,
      'block.save(update_fields=["timestamp"])',
    ].join('\n'),
  ])
  await waitUntil(env, url, (transaction) => Date.parse(transaction.executionDate) === timestamp * 1000)
}

const safeNonce = (context) =>
  new Contract(context.safeAddress, ['function nonce() view returns (uint256)'], context.provider).nonce()

/** Executes the named staging transactions from the Safe, optionally at their staging nonces. */
async function executeOrders(env, context, names, { stagingNonces = false } = {}) {
  const hashes = {}
  for (const name of names) {
    for (let nonce = Number(await safeNonce(context)); stagingNonces && nonce < staging[name].nonce; nonce++) {
      await execute(context.provider, context.safeAddress, context.signers, { to: context.safeAddress })
    }
    const { safeTxHash } = await execute(
      context.provider,
      context.safeAddress,
      context.signers,
      replayed(name, context.safeAddress),
    )
    hashes[name] = safeTxHash
  }
  // The executions only need their nonces on chain, so the indexing waits run together after the last one.
  const indexed = Object.entries(hashes).map(async ([name, hash]) => {
    if (TWAP_ORDERS.includes(name)) {
      await backdateExecution(env, hash, staging[name].executedAt)
    }
    const id = `multisig_${context.safeAddress}_${hash}`
    await waitUntil(
      env,
      `${env.SAFE_CGW_BASE_URL}/v1/chains/${context.chainId}/transactions/${id}`,
      (transaction) => transaction.txStatus === 'SUCCESS',
    )
    return [name, `&id=${id}`]
  })
  return Object.fromEntries(await Promise.all(indexed))
}

async function orderSafe(env, owners, stagingAddress, names, options) {
  const context = await deploySafe(env, owners, stagingAddress)
  try {
    return { address: context.safeAddress, ids: await executeOrders(env, context, names, options) }
  } finally {
    context.provider.destroy()
  }
}

/**
 * Replays the solver settlement of a recorded order: COW leaves through the vault relayer, DAI arrives.
 * The CoW API mock learns the local transaction hash, so the gateway shows a swap settlement.
 */
async function settleOrder(env, provider, safeAddress, payer, { validTo, sold, bought }) {
  const settlementCode = await provider.getCode(SETTLEMENT)
  const held = (await new Contract(DAI, erc20, provider).balanceOf(SETTLEMENT)) + bought
  await dealToken(provider, DAI, SETTLEMENT, held)
  // Running Multicall3 code at the settlement address makes both transfers come from it in one transaction.
  await provider.send('anvil_setCode', [SETTLEMENT, await provider.getCode(MULTICALL3)])
  let receipt
  try {
    receipt = await send(provider, payer, {
      to: SETTLEMENT,
      data: multicall.encodeFunctionData('aggregate3', [
        [
          [
            VAULT_RELAYER,
            false,
            vaultRelayer.encodeFunctionData('transferFromAccounts', [[[safeAddress, COW, sold, id('erc20')]]]),
          ],
          [DAI, false, erc20.encodeFunctionData('transfer', [safeAddress, bought])],
        ],
      ]),
    })
  } finally {
    await provider.send('anvil_setCode', [SETTLEMENT, settlementCode])
  }
  await runInLocalService(env, 'cow-api', [
    'python',
    '/cow_api.py',
    'register-settlement',
    receipt.hash,
    localOrderUid(validTo, safeAddress),
  ])
}

/** Rebuilds SEP_STATIC_SAFE_27: 1000 COW received, a TWAP order, its first settled part and a 1 COW transfer. */
async function buildTwapSafe(env, owners) {
  const context = await deploySafe(env, owners, '0xC97FCf0B8890a5a7b1a1490d44Dc9EbE3cE04884')
  const { provider, safeAddress } = context
  try {
    await dealToken(provider, COW, owners.owner4.address, parseEther('1000'))
    await send(provider, owners.owner4.address, {
      to: COW,
      data: erc20.encodeFunctionData('transfer', [safeAddress, parseEther('1000')]),
    })
    await executeOrders(env, context, ['safe27Twap'])
    await settleOrder(env, provider, safeAddress, owners.owner4.address, {
      validTo: 1730301239,
      sold: parseEther('250'),
      bought: 303169509056146764232n,
    })
    await executeOrders(env, context, ['safe27Out'])
    await provider.send('anvil_setBalance', [safeAddress, toQuantity(0)])
    await waitUntil(env, `${context.path}/balances/usd?trusted=false`, (balances) =>
      balances.items.some(({ tokenInfo, balance }) => tokenInfo.address === DAI && balance === '303169509056146764232'),
    )
    return safeAddress
  } finally {
    provider.destroy()
  }
}

const safe1 = '0x03042B890b99552b60A073F808100517fb148F60'
const limitOrderSafe = '0x8f4A19C85b39032A37f7a6dCc65234f966F72551'

function swapTxFixtures(ids) {
  return Object.fromEntries(Object.entries(ids).map(([name, value]) => [`swaps.${name}`, value]))
}

export async function prepareSwapWidgetScenario(env, owners) {
  return { safes: { static: await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_1']) } }
}

export async function prepareTwapWidgetScenario(env, owners) {
  await registerCowContracts(env)
  return { safes: { static: { SEP_STATIC_SAFE_27: `sep:${await buildTwapSafe(env, owners)}` } } }
}

export async function prepareTwapHistoryScenario(env, owners) {
  await registerCowContracts(env)
  const twapSafe = await buildTwapSafe(env, owners)
  const limit = await orderSafe(env, owners, limitOrderSafe, ['twapPartial', 'twapFilled'])
  return {
    safes: { static: { SEP_STATIC_SAFE_27: `sep:${twapSafe}` } },
    fixtures: {
      'swaps.twapPartiallyFilled': `sep:${limit.address}${limit.ids.twapPartial}`,
      'swaps.twapFilled': `sep:${limit.address}${limit.ids.twapFilled}`,
    },
  }
}

export async function prepareSwapHistoryScenario(env, owners) {
  await registerCowContracts(env)
  // The spec opens the history item with nonce 14, so that order is the newest one.
  const swaps = await orderSafe(env, owners, safe1, ['buy2actions', 'sell1Action'], { stagingNonces: true })
  const limit = await orderSafe(env, owners, limitOrderSafe, ['partiallyFilledLimit'])
  return {
    safes: { static: { SEP_STATIC_SAFE_1: `sep:${swaps.address}` } },
    fixtures: {
      ...swapTxFixtures(swaps.ids),
      'swaps.limitOrderSafe': `sep:${limit.address}`,
      'swaps.partiallyFilledLimitOrder': limit.ids.partiallyFilledLimit,
    },
  }
}

export async function prepareSwapDetailsScenario(env, owners) {
  await registerCowContracts(env)
  const swaps = await orderSafe(env, owners, safe1, ['buy2actions', 'sell1Action', 'safeAppSwapOrder'], {
    stagingNonces: true,
  })
  const wrap = await orderSafe(env, owners, '0xF184a243925Bf7fb1D64487339FF4F177Fb75644', ['wrapSwap'])
  const cancelled = await orderSafe(env, owners, '0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9', ['sellCancelled'])
  const threeActions = await orderSafe(env, owners, '0x140663Cb76e4c4e97621395fc118912fa674150B', ['sell3Actions'])
  return {
    safes: { static: { SEP_STATIC_SAFE_1: `sep:${swaps.address}` } },
    fixtures: {
      ...swapTxFixtures({ ...swaps.ids, ...wrap.ids, ...cancelled.ids, ...threeActions.ids }),
      'swaps.wrapSwapSafe': `sep:${wrap.address}`,
      'swaps.cancelledOrderSafe': cancelled.address,
      'swaps.threeActionsSafe': threeActions.address,
    },
  }
}

export async function prepareLimitOrderHistoryScenario(env, owners) {
  await registerCowContracts(env)
  const swaps = await orderSafe(env, owners, safe1, ['sellLimitOrder'], { stagingNonces: true })
  const limit = await orderSafe(env, owners, limitOrderSafe, ['sellLimitOrderFilled'])
  return {
    safes: { static: { SEP_STATIC_SAFE_1: `sep:${swaps.address}` } },
    fixtures: { ...swapTxFixtures({ ...swaps.ids, ...limit.ids }), 'swaps.limitOrderSafe': `sep:${limit.address}` },
  }
}

/** Rebuilds SEP_STATIC_SAFE_34 with its three CoW orders awaiting the second confirmation. */
export async function prepareSwapQueueScenario(env, owners) {
  await registerCowContracts(env)
  const context = await deploySafe(env, owners, '0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2')
  try {
    const amount = parseEther('800')
    await dealToken(context.provider, COW, owners.owner4.address, amount)
    await send(context.provider, owners.owner4.address, {
      to: COW,
      data: erc20.encodeFunctionData('transfer', [context.safeAddress, amount]),
    })
    const ids = {}
    for (const name of ['sellQLimitOrder', 'sellSwapQLimitOrder', 'sellTwapQLimitOrder']) {
      const transaction = await context.safe.createTransaction({
        transactions: [replayed(name, context.safeAddress)],
        options: { nonce: staging[name].nonce },
      })
      ids[name] = (await proposeTransaction(context, transaction)).id
    }
    await waitUntil(env, `${context.path}/transactions/queued`, (queue) =>
      Object.values(ids).every((id) => JSON.stringify(queue).includes(id.split('_').at(-1))),
    )
    return {
      safes: { static: { SEP_STATIC_SAFE_34: `sep:${context.safeAddress}` } },
      fixtures: swapTxFixtures({ ...ids, swapQueue: ids.sellSwapQLimitOrder }),
    }
  } finally {
    context.provider.destroy()
  }
}

/**
 * Rebuilds SEP_STATIC_SAFE_1 with the settlement of its CoW Swap Safe App order: 10 COW sold for 363.19846 DAI.
 * The vault relayer approval stands in for the earlier staging approvals.
 */
export async function buildSwapSettlementSafe(env, owners) {
  await registerCowContracts(env)
  const context = await deploySafe(env, owners, safe1)
  const { provider, safeAddress } = context
  try {
    const sold = parseEther('10')
    await dealToken(provider, COW, owners.owner4.address, sold)
    await send(provider, owners.owner4.address, {
      to: COW,
      data: erc20.encodeFunctionData('transfer', [safeAddress, sold]),
    })
    await execute(provider, safeAddress, context.signers, {
      to: COW,
      data: new Interface(['function approve(address,uint256)']).encodeFunctionData('approve', [
        VAULT_RELAYER,
        MaxUint256,
      ]),
    })
    await executeOrders(env, context, ['safeAppSwapOrder'])
    await settleOrder(env, provider, safeAddress, owners.owner4.address, {
      validTo: 1719486675,
      sold,
      bought: 363198460147836860990n,
    })
    await waitUntil(env, `${context.path}/transactions/history?trusted=false`, (history) =>
      history.results.some(({ transaction }) => transaction?.txInfo.type === 'SwapTransfer'),
    )
    return safeAddress
  } finally {
    provider.destroy()
  }
}
