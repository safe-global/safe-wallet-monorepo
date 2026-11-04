#!/usr/bin/env node

/**
 * Fetch MSW Fixtures Script
 *
 * Downloads real API responses from the Safe Client Gateway (staging)
 * and saves them as JSON fixtures for use in Storybook stories.
 *
 * Usage (Node ≥24 runs .ts directly):
 *   node config/test/msw/scripts/fetch-fixtures.ts
 *   node config/test/msw/scripts/fetch-fixtures.ts --safe=ef-safe
 *   node config/test/msw/scripts/fetch-fixtures.ts --group=transactions
 *   node config/test/msw/scripts/fetch-fixtures.ts --group=swaps
 *   node config/test/msw/scripts/fetch-fixtures.ts --group=staking
 */

import * as fs from 'fs'
import * as path from 'path'

const GATEWAY_URL = 'https://safe-client.staging.5afe.dev'
const FIXTURES_DIR = path.join(import.meta.dirname, '../fixtures')
const CONFIG_SERVICE_KEY = process.env.NEXT_PUBLIC_CONFIG_SERVICE_KEY || 'WALLET_WEB'

// Safe addresses for different scenarios
const SAFES = {
  'ef-safe': {
    address: '0x9fC3dc011b461664c835F2527fffb1169b3C213e',
    chainId: '1',
    description: 'EF Safe - DeFi heavy ($142M in positions)',
  },
  vitalik: {
    address: '0x220866b1a2219f40e72f5c628b65d54268ca3a9d',
    chainId: '1',
    description: 'Vitalik Safe - Whale with many tokens (1551 tokens)',
  },
  'spam-tokens': {
    address: '0x9d94ef33e7f8087117f85b3ff7b1d8f27e4053d5',
    chainId: '1',
    description: 'Safe with spam tokens',
  },
  'safe-token-holder': {
    address: '0x8675B754342754A30A2AeF474D114d8460bca19b',
    chainId: '1',
    description: 'Safe Token holder with diverse DeFi (15 apps)',
  },
} as const

type SafeKey = keyof typeof SAFES

const TX_HISTORY_SAFE = {
  address: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  chainId: '11155111',
} as const

const HISTORY_TRANSACTION_IDS = {
  'on-chain-rejection': `multisig_${TX_HISTORY_SAFE.address}_0x9b4ee6ef9271fa2f2a4e97c3b5165dc7844a124accbf02cddaf91393ef2687da`,
  batch: `multisig_${TX_HISTORY_SAFE.address}_0x4dd0916d9fea51b6b724ff8155c3e7cd616f2c54634c0769b9dc0edfd4f6b2b8`,
  'add-owner': `multisig_${TX_HISTORY_SAFE.address}_0x85835820c4119ea7e44537dd4a447264cc08d80ea1467b545b500670573c3d2d`,
  'swap-owner': `multisig_${TX_HISTORY_SAFE.address}_0xd7a2578ba2e610959961ad9816115d33521d7e7904797cece08051c38fa3af6f`,
  'remove-owner': `multisig_${TX_HISTORY_SAFE.address}_0xafd58598ec10f89395d57c4d914480e50a568416e3226bc4d1853fae06697929`,
  'disable-module': `multisig_${TX_HISTORY_SAFE.address}_0xb82070c01297392754b4b972c064f48f4ab944c5979813c01b871c8f8d57bc4a`,
  'change-threshold': `multisig_${TX_HISTORY_SAFE.address}_0x46eb9b5370d38a676d0bc895dbd8e7e3c9544f121c7019bfb0e632597d7be7d5`,
  'receive-qtrust': `transfer_${TX_HISTORY_SAFE.address}_ed89d768d24991bca3a9eed93f369a3fa10727accc3d02aacb5c38794ba5b9136119`,
} as const

type TransactionList = 'history' | 'queued'

type RecordedTransaction = {
  chainId: string
  safe: string
  safeTxHash: string
  list: TransactionList
}

type TransactionSet = {
  dir: string
  /** The recording fails unless every details response has one of these txInfo types */
  txInfoTypes: string[]
  transactions: Record<string, RecordedTransaction>
}

const SWAP_SAFE = '0x03042B890b99552b60A073F808100517fb148F60'
const LIMIT_ORDER_SAFE = '0x8f4A19C85b39032A37f7a6dCc65234f966F72551'
const QUEUED_ORDER_SAFE = '0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2'
const STAKING_SAFE = '0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B'

const sepolia = (safe: string, safeTxHash: string, list: TransactionList = 'history'): RecordedTransaction => ({
  chainId: '11155111',
  safe,
  safeTxHash,
  list,
})

const SWAP_TRANSACTIONS: TransactionSet = {
  dir: 'swaps',
  txInfoTypes: ['SwapOrder', 'TwapOrder'],
  transactions: {
    sell1Action: sepolia(SWAP_SAFE, '0xd033466000a40227fba7a7deb1a668371c213fec90bac9f2583096be2e0fd959'),
    buy2actions: sepolia(SWAP_SAFE, '0x135ff0282653d4c2a62c76cd247764b1abd4c0daa9201a72964feac2acaa7b44'),
    safeAppSwapOrder: sepolia(SWAP_SAFE, '0x5f08e05edb210a8990791e9df2f287a5311a8137815ec85856a2477a36552f1e'),
    sellLimitOrder: sepolia(SWAP_SAFE, '0xf7093c3e87e3b703a0df4d9360cd38254ed69d0dc4f7ff5399a194bd92e9014c'),
    wrapSwap: sepolia(
      '0xF184a243925Bf7fb1D64487339FF4F177Fb75644',
      '0x06d7e5920bb59a38cf46436b146c33e7307d690875f7d64bca32a0b0c3394deb',
    ),
    sell3Actions: sepolia(
      '0x140663Cb76e4c4e97621395fc118912fa674150B',
      '0x9f3d2c9c9879fb7eee7005d57b2b5c9006d7c8b98241aa49a0b9e769411c58ef',
    ),
    sellCancelled: sepolia(
      '0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9',
      '0xbe159adaa7fb0f7e80ad4bab33a2bb341043818478c96916cfa3877303d22a3d',
    ),
    sellLimitOrderFilled: sepolia(
      LIMIT_ORDER_SAFE,
      '0xd3d13db9fc438d0674819f81be62fcd9c74a8ed7c101a8249b8895e55ee80d76',
    ),
    partiallyFilledLimit: sepolia(
      LIMIT_ORDER_SAFE,
      '0x3faf510142c9ade7ac2a701fb697b95f321fd51f5eb9b17e7e534a8abe472b07',
    ),
    twapPartial: sepolia(LIMIT_ORDER_SAFE, '0x2fdf5e5d94306de5f7285fd74ca014067b090338b3ff15e3f66d6c02ef81e4a4'),
    twapFilled: sepolia(LIMIT_ORDER_SAFE, '0xc8a9399afbba45e82a0645770db38386cbe10bec77dd8b6395f7d24e19a45c9a'),
    sellQLimitOrder: sepolia(
      QUEUED_ORDER_SAFE,
      '0x4a699a1a0fe8dcf0bb2f1ccd550bd403dad6b93ca9b1f146aeed90f0a6de6c0c',
      'queued',
    ),
    sellSwapQLimitOrder: sepolia(
      QUEUED_ORDER_SAFE,
      '0xc2a59a93e1cbaeab5fde7a5d4cc63938e1b1e4597c7e203146a6e6e07b43a92f',
      'queued',
    ),
    sellTwapQLimitOrder: sepolia(
      QUEUED_ORDER_SAFE,
      '0x0f9fb46e5d85bdb11f85bdf356078bb2caaf5508504b5ddb8aba2ce5e3aa58ae',
      'queued',
    ),
  },
}

const STAKING_TRANSACTIONS: TransactionSet = {
  dir: 'staking',
  txInfoTypes: ['NativeStakingDeposit', 'NativeStakingValidatorsExit'],
  transactions: {
    stake: {
      chainId: '1',
      safe: STAKING_SAFE,
      safeTxHash: '0xd1699838071a472d26963f2b823a4c835e9acd449d0376ca1d468a666903130d',
      list: 'history',
    },
    withdrawal: {
      chainId: '1',
      safe: STAKING_SAFE,
      safeTxHash: '0x84f2ec635b73eaaea60ba813b12deaa370f413651ba08861cc0e9f080bffbecc',
      list: 'history',
    },
  },
}

// Endpoints to fetch
const ENDPOINTS = {
  portfolio: (address: string) => `/v1/portfolio/${address}?fiatCode=USD`,
  balances: (address: string, chainId: string) =>
    `/v1/chains/${chainId}/safes/${address}/balances/USD?trusted=false&exclude_spam=false`,
  positions: (address: string, chainId: string) => `/v1/chains/${chainId}/safes/${address}/positions/USD`,
  safe: (address: string, chainId: string) => `/v1/chains/${chainId}/safes/${address}`,
  chains: (serviceKey: string) => `/v2/chains?serviceKey=${serviceKey}`,
  txHistory: (address: string, chainId: string) =>
    `/v1/chains/${chainId}/safes/${address}/transactions/history?trusted=false&imitation=true`,
  txQueue: (address: string, chainId: string) => `/v1/chains/${chainId}/safes/${address}/transactions/queued`,
  txDetails: (txId: string, chainId: string) => `/v1/chains/${chainId}/transactions/${txId}`,
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} from ${url}`)
  }
  return response.json()
}

async function saveFixture(filename: string, data: unknown): Promise<void> {
  const filepath = path.join(FIXTURES_DIR, filename)
  const dir = path.dirname(filepath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
  console.log(`  ✓ Saved ${filename}`)
}

async function fetchSafeFixtures(safeKey: SafeKey): Promise<void> {
  const safe = SAFES[safeKey]
  console.log(`\nFetching fixtures for ${safeKey}: ${safe.description}`)

  try {
    // Portfolio
    const portfolioUrl = `${GATEWAY_URL}${ENDPOINTS.portfolio(safe.address)}`
    const portfolio = await fetchJson(portfolioUrl)
    await saveFixture(`portfolio/${safeKey}.json`, portfolio)

    // Balances
    const balancesUrl = `${GATEWAY_URL}${ENDPOINTS.balances(safe.address, safe.chainId)}`
    const balances = await fetchJson(balancesUrl)
    await saveFixture(`balances/${safeKey}.json`, balances)

    // Positions
    const positionsUrl = `${GATEWAY_URL}${ENDPOINTS.positions(safe.address, safe.chainId)}`
    const positions = await fetchJson(positionsUrl)
    await saveFixture(`positions/${safeKey}.json`, positions)

    // Safe info
    const safeUrl = `${GATEWAY_URL}${ENDPOINTS.safe(safe.address, safe.chainId)}`
    const safeInfo = await fetchJson(safeUrl)
    await saveFixture(`safes/${safeKey}.json`, safeInfo)
  } catch (error) {
    console.error(`  ✗ Error fetching ${safeKey}:`, error)
  }
}

async function fetchChainFixtures(): Promise<void> {
  console.log('\nFetching chain configuration...')

  try {
    const chainsUrl = `${GATEWAY_URL}${ENDPOINTS.chains(CONFIG_SERVICE_KEY)}`
    const chains = await fetchJson(chainsUrl)
    await saveFixture('chains/all.json', chains)

    // Also save individual mainnet config
    const chainResults = (chains as { results: Array<{ chainId: string }> }).results
    const mainnet = chainResults.find((c) => c.chainId === '1')
    if (mainnet) {
      await saveFixture('chains/mainnet.json', mainnet)
    }
  } catch (error) {
    console.error('  ✗ Error fetching chains:', error)
  }
}

async function fetchTransactionFixtures(): Promise<void> {
  const { address, chainId } = TX_HISTORY_SAFE
  console.log(`\nFetching transaction history of ${address} on chain ${chainId}...`)

  const history = await fetchJson(`${GATEWAY_URL}${ENDPOINTS.txHistory(address, chainId)}`)
  await saveFixture('transactions/history.json', history)

  for (const [name, txId] of Object.entries(HISTORY_TRANSACTION_IDS)) {
    const details = await fetchJson(`${GATEWAY_URL}${ENDPOINTS.txDetails(txId, chainId)}`)
    await saveFixture(`transactions/details/${name}.json`, details)
  }
}

type TransactionListPage = {
  next?: string | null
  results: Array<{ type: string; transaction?: { id: string } }>
}

/** Pages through a Safe's history or queue until it finds the list item of the transaction */
async function findListItem({ chainId, safe, list }: RecordedTransaction, txId: string): Promise<unknown> {
  const firstPage = list === 'history' ? ENDPOINTS.txHistory(safe, chainId) : ENDPOINTS.txQueue(safe, chainId)
  let pageUrl: string | null | undefined = `${GATEWAY_URL}${firstPage}`

  while (pageUrl) {
    const page = (await fetchJson(pageUrl)) as TransactionListPage
    const item = page.results.find(({ transaction }) => transaction?.id === txId)
    if (item) {
      return item
    }
    pageUrl = page.next
  }

  throw new Error(`No ${list} item with id ${txId} for Safe ${safe} on chain ${chainId}`)
}

async function fetchTransactionSet({ dir, txInfoTypes, transactions }: TransactionSet): Promise<void> {
  console.log(`\nFetching the ${dir} transactions...`)

  for (const [name, transaction] of Object.entries(transactions)) {
    const txId = `multisig_${transaction.safe}_${transaction.safeTxHash}`
    const details = (await fetchJson(`${GATEWAY_URL}${ENDPOINTS.txDetails(txId, transaction.chainId)}`)) as {
      txInfo: { type: string }
    }
    if (!txInfoTypes.includes(details.txInfo.type)) {
      throw new Error(
        `${name} decodes as ${details.txInfo.type}, expected one of ${txInfoTypes.join(', ')}. ` +
          'The gateway did not decode it; record again when it does.',
      )
    }
    const item = await findListItem(transaction, txId)
    await saveFixture(`transactions/${dir}/${name}.json`, { item, details })
  }
}

const FIXTURE_GROUPS: Record<string, () => Promise<void>> = {
  transactions: fetchTransactionFixtures,
  swaps: () => fetchTransactionSet(SWAP_TRANSACTIONS),
  staking: () => fetchTransactionSet(STAKING_TRANSACTIONS),
}

async function createEmptyFixtures(): Promise<void> {
  console.log('\nCreating empty state fixtures...')

  // Empty portfolio
  await saveFixture('portfolio/empty.json', {
    totalBalanceFiat: '0',
    totalTokenBalanceFiat: '0',
    totalPositionsBalanceFiat: '0',
    tokenBalances: [],
    positionBalances: [],
  })

  // Empty balances
  await saveFixture('balances/empty.json', {
    fiatTotal: '0',
    items: [],
  })

  // Empty positions
  await saveFixture('positions/empty.json', [])
}

/** Parse --safe= argument from command line args */
function parseSafeArg(args: string[]): SafeKey | undefined {
  return args.find((a) => a.startsWith('--safe='))?.split('=')[1] as SafeKey | undefined
}

function parseGroupArg(args: string[]): string | undefined {
  return args.find((a) => a.startsWith('--group='))?.split('=')[1]
}

async function fetchGroup(group: string): Promise<void> {
  const fetchFixtures = FIXTURE_GROUPS[group]
  if (!fetchFixtures) {
    console.error(`Unknown group: ${group}. Available: ${Object.keys(FIXTURE_GROUPS).join(', ')}`)
    process.exit(1)
  }
  await fetchFixtures()
}

/** Fetch fixtures for a single safe, exit with error if unknown */
async function fetchSingleSafe(safeArg: SafeKey): Promise<void> {
  if (!SAFES[safeArg]) {
    console.error(`Unknown safe: ${safeArg}. Available: ${Object.keys(SAFES).join(', ')}`)
    process.exit(1)
  }
  await fetchSafeFixtures(safeArg)
}

/** Fetch all fixtures: chains, all safes, empty fixtures and every group */
async function fetchAllFixtures(): Promise<void> {
  await fetchChainFixtures()

  for (const safeKey of Object.keys(SAFES) as SafeKey[]) {
    await fetchSafeFixtures(safeKey)
  }

  await createEmptyFixtures()

  for (const fetchFixtures of Object.values(FIXTURE_GROUPS)) {
    await fetchFixtures()
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const safeArg = parseSafeArg(args)
  const groupArg = parseGroupArg(args)

  console.log('🔄 Fetching MSW fixtures from staging gateway...')
  console.log(`   Gateway: ${GATEWAY_URL}`)

  if (safeArg) {
    await fetchSingleSafe(safeArg)
  } else if (groupArg) {
    await fetchGroup(groupArg)
  } else {
    await fetchAllFixtures()
  }

  console.log('\n✅ Done!')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
