import { Interface, ZeroAddress, getAddress, randomBytes, hexlify } from 'ethers'
import { ALLOWANCE_MODULE, allowanceCall, registerAllowanceModule } from './allowance.mjs'
import { execute, stagingOwners } from './staging.mjs'
import { dealToken, erc20, multiSend, send, waitForNextSecond, SEPOLIA } from './chain.mjs'
import { registerToken, trustToken } from './tokens.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { localProvider } from './provider.mjs'
import { waitUntil } from './indexing.mjs'

const { owner3, owner4, sepoliaOwner2 } = stagingOwners
const recipient = '0x06373d5e45AD31BD354CeBfA8dB4eD2c75B8708e'
const addedOwner = '0x01A9F68e339da12565cfBc47fe7D6EdEcB11C46f'
const swappedOwner = '0x8a39cE4E27C326B87B75AaFf820D442311CD8E4E'
const qaTrusted = '0x7CB180dE9BE0d8935EbAAc9b4fc533952Df128Ae'
const testTokenOne = '0x4463F6662be2fdb319Dc3C491A004DEAe39Dc70a'
const proxyFactory = '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC'
const safeL2Singleton = '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA'
const fallbackHandler = getAddress('0x017062a1de2fe6b99be3d9d37841fed19f573804')
const sentinel = '0x0000000000000000000000000000000000000001'

const safeInterface = new Interface([
  'function setup(address[],uint256,address,bytes,address,address,uint256,address)',
  'function enableModule(address)',
  'function disableModule(address,address)',
  'function addOwnerWithThreshold(address,uint256)',
  'function swapOwner(address,address,address)',
  'function removeOwner(address,address,uint256)',
  'function changeThreshold(uint256)',
])
const factory = new Interface([
  'function createProxyWithNonce(address,bytes,uint256) returns (address)',
  'event ProxyCreation(address proxy, address singleton)',
])

// Staging executed these batches through MultiSendCallOnly 1.3.0, which the history shows.
const stagingMultiSend = (calls) => multiSend(calls, { version: '1.3.0' })

const settings = (safe, method, args) => ({ to: safe, data: safeInterface.encodeFunctionData(method, args) })

// The executed history of staging SEP_STATIC_SAFE_7, oldest first, with the staging execution dates.
function stagingHistory(safe) {
  return [
    { at: '2023-11-30T11:00:48Z', from: sepoliaOwner2, value: 10000000n },
    { at: '2023-11-30T11:02:12Z', signers: [sepoliaOwner2], to: recipient, value: 1000000n },
    {
      at: '2023-11-30T11:06:00Z',
      signers: [owner4],
      ...stagingMultiSend([
        settings(safe, 'enableModule', [ALLOWANCE_MODULE]),
        allowanceCall('addDelegate', [owner4]),
        allowanceCall('setAllowance', [owner4, ZeroAddress, 100000000000n, 0, 0]),
      ]),
    },
    { at: '2023-11-30T11:08:48Z', signers: [owner4], ...allowanceCall('deleteAllowance', [owner4, ZeroAddress]) },
    { at: '2023-11-30T11:17:24Z', signers: [owner4], to: safe },
    {
      at: '2023-11-30T11:24:00Z',
      signers: [owner4],
      ...stagingMultiSend([
        { to: recipient, value: 2000000n },
        { to: recipient, value: 2000000n },
      ]),
    },
    { at: '2023-11-30T11:27:24Z', signers: [owner4], ...settings(safe, 'addOwnerWithThreshold', [addedOwner, 1]) },
    {
      at: '2023-11-30T11:29:00Z',
      signers: [owner4],
      ...stagingMultiSend([
        allowanceCall('addDelegate', [addedOwner]),
        allowanceCall('setAllowance', [addedOwner, ZeroAddress, 1000000000000n, 0, 0]),
      ]),
    },
    { at: '2023-11-30T11:34:24Z', from: sepoliaOwner2, value: 500000000000000n },
    {
      at: '2023-11-30T11:45:48Z',
      signers: [owner4],
      ...settings(safe, 'swapOwner', [sentinel, addedOwner, swappedOwner]),
    },
    { at: '2023-11-30T11:46:48Z', signers: [owner4], ...settings(safe, 'removeOwner', [sentinel, swappedOwner, 1]) },
    { at: '2023-11-30T11:48:48Z', signers: [owner4], ...settings(safe, 'changeThreshold', [2]) },
    { at: '2023-11-30T11:51:36Z', signers: [sepoliaOwner2, owner4], ...settings(safe, 'changeThreshold', [1]) },
    {
      at: '2023-12-01T07:37:24Z',
      signers: [owner4],
      ...settings(safe, 'disableModule', [sentinel, ALLOWANCE_MODULE]),
    },
    { at: '2023-12-01T07:52:36Z', from: sepoliaOwner2, value: 500000000000000000n },
    {
      at: '2023-12-01T07:54:36Z',
      signers: [sepoliaOwner2],
      ...stagingMultiSend([
        { to: recipient, value: 10000000000000000n },
        { to: recipient, value: 50000000000000000n },
      ]),
    },
    { at: '2023-12-01T08:05:00Z', from: recipient, value: 1000000000000000n },
    { at: '2023-12-01T08:05:00Z', from: recipient, value: 1000000000000000n },
    // Staging received these in one transaction; the history lists them newest first as 5, 19, 12, 10.
    ...[10n, 12n, 19n, 5n].map((amount) => ({
      at: '2023-12-01T08:15:24Z',
      from: recipient,
      token: testTokenOne,
      amount: amount * 10n ** 18n,
    })),
    { at: '2023-12-06T08:36:00Z', signers: [sepoliaOwner2], ...settings(safe, 'changeThreshold', [2]) },
    { at: '2023-12-15T10:33:00Z', from: sepoliaOwner2, token: qaTrusted, amount: 1000n * 10n ** 18n },
    {
      at: '2024-07-05T08:23:00Z',
      signers: [owner4, sepoliaOwner2],
      ...settings(safe, 'addOwnerWithThreshold', [owner3, 2]),
    },
    { at: '2025-03-17T09:38:12Z', signers: [sepoliaOwner2, owner4], to: sepoliaOwner2, value: 100000000000000n },
    { at: '2025-03-18T12:51:00Z', signers: [owner4, sepoliaOwner2], to: safe },
  ]
}

async function createStagingSafe(provider) {
  const setup = safeInterface.encodeFunctionData('setup', [
    [owner4, sepoliaOwner2],
    1,
    ZeroAddress,
    '0x',
    fallbackHandler,
    ZeroAddress,
    0,
    ZeroAddress,
  ])
  const receipt = await send(provider, owner4, {
    to: proxyFactory,
    data: factory.encodeFunctionData('createProxyWithNonce', [
      safeL2Singleton,
      setup,
      BigInt(hexlify(randomBytes(16))),
    ]),
  })
  const creation = receipt.logs.map((log) => factory.parseLog(log)).find((log) => log?.name === 'ProxyCreation')
  if (!creation) throw new Error(`Staging Safe deployment ${receipt.hash} emitted no ProxyCreation event`)
  return { safeAddress: getAddress(creation.args.proxy), receipt }
}

async function runStep(provider, safeAddress, step) {
  if (step.signers) return (await execute(provider, safeAddress, step.signers, step)).receipt
  if (!step.token) return await send(provider, step.from, { to: safeAddress, value: step.value })
  await dealToken(provider, step.token, step.from, step.amount)
  return await send(provider, step.from, {
    to: step.token,
    data: erc20.encodeFunctionData('transfer', [safeAddress, step.amount]),
  })
}

const historyCount = 28

/**
 * Rebuilds staging SEP_STATIC_SAFE_7 and its executed history, with the staging owners impersonated.
 * The fixture `history.timeline` maps each staging execution date to the local one for the date filters.
 */
export async function prepareHistoryScenario(env) {
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    // Known before its transfers, so CGW never caches the history without the token's symbol and decimals.
    const metadata = Promise.all([
      trustToken(env, qaTrusted),
      registerToken(env, { address: testTokenOne, name: 'test-token-type-one', symbol: 'TTONE', decimals: 18 }),
      registerAllowanceModule(env),
    ])
    const { safeAddress, receipt } = await createStagingSafe(provider)
    const path = `${env.SAFE_CGW_BASE_URL}/v1/chains/${SEPOLIA}/safes/${safeAddress}`
    await Promise.all([metadata, waitUntil(env, path, (safe) => safe.nonce === 0)])
    let previous = { at: '2023-11-30T10:30:00Z', timestamp: (await provider.getBlock(receipt.blockNumber)).timestamp }
    const timeline = [[Date.parse(previous.at), previous.timestamp * 1000]]
    for (const step of stagingHistory(safeAddress)) {
      if (step.at !== previous.at) await waitForNextSecond(provider, previous.timestamp)
      const { blockNumber } = await runStep(provider, safeAddress, step)
      previous = { at: step.at, timestamp: (await provider.getBlock(blockNumber)).timestamp }
      timeline.push([Date.parse(step.at), previous.timestamp * 1000])
    }
    await waitUntil(env, path, (safe) => safe.nonce === 17 && safe.threshold === 2 && safe.owners.length === 3)
    const page = `cursor=${encodeURIComponent('limit=100&offset=0')}`
    await waitUntil(
      env,
      `${path}/transactions/history?trusted=false&${page}`,
      (history) => history.results.filter(({ type }) => type === 'TRANSACTION').length === historyCount,
    )
    await waitUntil(env, `${path}/transactions/history?trusted=true&${page}`, (history) =>
      history.results.some((item) => item.transaction?.txInfo.transferInfo?.tokenAddress === qaTrusted),
    )
    return {
      safes: { static: { SEP_STATIC_SAFE_7: `sep:${safeAddress}` } },
      fixtures: { 'history.timeline': timeline },
    }
  } finally {
    provider.destroy()
  }
}

export async function prepareAddressBookHistoryScenario(env, owners) {
  const history = await prepareHistoryScenario(env)
  const safes = await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_4'])
  return { ...history, safes: { static: { ...history.safes.static, ...safes } } }
}
