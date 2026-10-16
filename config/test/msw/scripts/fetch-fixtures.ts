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

const FIXTURE_GROUPS: Record<string, () => Promise<void>> = {
  transactions: fetchTransactionFixtures,
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
