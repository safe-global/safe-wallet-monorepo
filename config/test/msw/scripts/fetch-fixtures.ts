#!/usr/bin/env npx ts-node

/**
 * Fetch MSW Fixtures Script
 *
 * Downloads real API responses from the Safe Client Gateway (staging)
 * and saves them as JSON fixtures for use in Storybook stories.
 *
 * Usage:
 *   npx ts-node config/test/msw/scripts/fetch-fixtures.ts
 *   npx ts-node config/test/msw/scripts/fetch-fixtures.ts --safe ef-safe
 *   npx ts-node config/test/msw/scripts/fetch-fixtures.ts --endpoint portfolio
 */

import * as fs from 'fs'
import * as path from 'path'

const GATEWAY_URL = 'https://safe-client.staging.5afe.dev'
const FIXTURES_DIR = path.join(__dirname, '../fixtures')

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

// Endpoints to fetch
const ENDPOINTS = {
  portfolio: (address: string) => `/v1/portfolio/${address}?fiatCode=USD`,
  balances: (address: string, chainId: string) =>
    `/v1/chains/${chainId}/safes/${address}/balances/USD?trusted=false&exclude_spam=false`,
  positions: (address: string, chainId: string) => `/v1/chains/${chainId}/safes/${address}/positions/USD`,
  safe: (address: string, chainId: string) => `/v1/chains/${chainId}/safes/${address}`,
  chains: () => `/v1/chains`,
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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
    const chainsUrl = `${GATEWAY_URL}${ENDPOINTS.chains()}`
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

/** Fetch fixtures for a single safe, exit with error if unknown */
async function fetchSingleSafe(safeArg: SafeKey): Promise<void> {
  if (!SAFES[safeArg]) {
    console.error(`Unknown safe: ${safeArg}. Available: ${Object.keys(SAFES).join(', ')}`)
    process.exit(1)
  }
  await fetchSafeFixtures(safeArg)
}

/** Fetch all fixtures: chains, all safes, and empty fixtures */
async function fetchAllFixtures(): Promise<void> {
  await fetchChainFixtures()

  for (const safeKey of Object.keys(SAFES) as SafeKey[]) {
    await fetchSafeFixtures(safeKey)
  }

  await createEmptyFixtures()
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const safeArg = parseSafeArg(args)

  console.log('🔄 Fetching MSW fixtures from staging gateway...')
  console.log(`   Gateway: ${GATEWAY_URL}`)

  if (safeArg) {
    await fetchSingleSafe(safeArg)
  } else {
    await fetchAllFixtures()
  }

  console.log('\n✅ Done!')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
