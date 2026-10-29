import { readFileSync } from 'node:fs'
import { Interface, getAddress, parseEther } from 'ethers'
import { registerContracts } from './contracts.mjs'
import { runInLocalService } from './local-service.mjs'
import { createSafe, proposeTransaction } from './safe.mjs'
import { localAddress, stagingOwners } from './staging.mjs'
import { COMPOSABLE_COW, COW, SETTLEMENT } from './cow-protocol.mjs'
import { dealToken, send, SEPOLIA } from './chain.mjs'
import { trustToken } from './tokens.mjs'
import { waitUntil } from './indexing.mjs'

// Staging CoW Protocol transactions; the local CoW API mock (infra/mocks/cow-api.ts) serves their orders.
const staging = JSON.parse(readFileSync(new URL('./cow-transactions.json', import.meta.url), 'utf8'))
const recorded = JSON.parse(readFileSync(new URL('../infra/mocks/cow-api-orders.json', import.meta.url), 'utf8')).orders

const { owner4, sepoliaOwner2 } = stagingOwners

// Owners of the staging Safes that the CoW scenarios rebuild.
const orderSafes = {
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

const erc20 = new Interface(['function transfer(address,uint256) returns (bool)'])

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
  if (!order) throw new Error(`No recorded CoW order has validTo ${validTo}; record it in cow-api-orders.json`)
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

function swapTxFixtures(ids) {
  return Object.fromEntries(Object.entries(ids).map(([name, value]) => [`swaps.${name}`, value]))
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
      fixtures: swapTxFixtures(ids),
    }
  } finally {
    context.provider.destroy()
  }
}
