#!/usr/bin/env node

/**
 * Fetch MSW Fixtures Script
 *
 * Downloads real API responses from the Safe Client Gateway (staging)
 * and saves them as JSON fixtures for use in Storybook stories.
 * Remote images become local WebP files in the apps/web/.storybook/mock-assets folder,
 * and the vitalik balances keep only a curated set of tokens.
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
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const GATEWAY_URL = 'https://safe-client.staging.5afe.dev'
const FIXTURES_DIR = path.join(import.meta.dirname, '../fixtures')
const MOCK_ASSETS_DIR = path.join(import.meta.dirname, '../../../../apps/web/.storybook/mock-assets')
const CONFIG_SERVICE_KEY = process.env.NEXT_PUBLIC_CONFIG_SERVICE_KEY || 'WALLET_WEB'

// Shown for a logo that is missing upstream, like the app does
const PLACEHOLDER_IMAGE = 'images/common/token-placeholder.svg'
// The schema types appInfo.logoUrl as an absolute URI, so a relative path fails validation
const DATA_URI_KEYS = new Set(['logoUrl'])
const IMAGE_EXTENSION = /\.(png|svg|jpe?g|webp|gif)$/i
const MISSING_IMAGE_STATUSES = new Set([403, 404])

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
    description: 'Vitalik Safe - Whale, trimmed to a curated set of tokens',
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

type KeptTokens = {
  /** Token addresses to keep in the balances */
  balances: readonly string[]
  /** `chainId:address` of the tokens to keep in the portfolio */
  portfolio: readonly string[]
}

// Real tokens with a working logo; the whale's full list of ~900 tokens is mostly spam and adds nothing to stories
const KEPT_TOKENS: Partial<Record<SafeKey, KeptTokens>> = {
  vitalik: {
    balances: [
      '0x0000000000000000000000000000000000000000', // ETH
      '0x5488eFf1976E4A56b4255e926D419a7054dF196a', // CITTY
      '0xB6eD7644C69416d67B522e20bC294A9a9B405B31', // 0XBTC
      '0x5026F006B85729a8b14553FAE6af249aD16c9aaB', // WOJAK
      '0xE07C41E9CDf7e0a7800e4bbF90d414654fD6413D', // CBDC
      '0x614D7f40701132E25fe6fc17801Fbd34212d2Eda', // BLAST
      '0x8727c112C712c4a03371AC87a74dD6aB104Af768', // JET
      '0xB67718b98d52318240c52E71A898335da4A28c42', // INNBC
      '0xAd0B2fCD6314e9cf8C0873D5129dde3Ead1dCc65', // MEMERICA
      '0xB03eEF386A61b5b462051636001485FFfdD3d843', // AMERICA
      '0xa9D54F37EbB99f83B603Cc95fc1a5f3907AacCfd', // PIKA
      '0x5cc5E64AB764A0f1E97F23984E20fD4528356a6a', // XRGB
      '0xDf4C0665e67CF0698447cA9e454Ed56cC6F2Df1e', // T6900
      '0x602f65BB8B8098Ad804E99DB6760Fd36208cD967', // MOPS
      '0xE5B826Ca2Ca02F09c1725e9bd98d9a8874C30532', // ZEON
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x8a7b7B9B2f7d0c63F66171721339705A6188a7D5', // EDOGE
      '0xe2512A2f19F0388aD3D7A5263eaA82AcD564827b', // SHIDO
      '0xA67E9F021B9d208F7e3365B2A155E3C55B27de71', // KLEE
      '0x0cbA60Ca5eF4D42f92A5070A8fEDD13BE93E2861', // THE
      '0xA728Aa2De568766E2Fa4544Ec7A77f79c0bf9F97', // JOK
      '0x01995A697752266d8E748738aAa3F06464B8350B', // CANA
      '0xDB99B0477574Ac0B2d9c8cec56B42277DA3fdb82', // DECT
      '0x698b1d54E936b9F772b8F58447194bBc82EC1933', // PEEZY
      '0x08d32b0da63e2C3bcF8019c9c5d849d7a9d791e6', // DCN
      '0x8530b66ca3DDf50E0447eae8aD7eA7d5e62762eD', // METADOGE
      '0x0d02755a5700414B26FF040e1dE35D337DF56218', // BEND
      '0xc5fB36dd2fb59d3B98dEfF88425a3F425Ee469eD', // TSUKA
      '0xee772CEc929D8430b4Fa7a01cD7FbD159a68Aa83', // SHANG
      '0xa283aA7CfBB27EF0cfBcb2493dD9F4330E0fd304', // MM
      '0x9ABFc0f085C82Ec1Be31D30843965FCC63053fFe', // Q*
      '0x39207D2E2fEEF178FBdA8083914554C59D9f8c00', // INUS
      '0x232FB065D9d24c34708eeDbF03724f2e95ABE768', // SHEESHA
      '0x558EC3152e2eb2174905cd19AeA4e34A23DE9aD6', // BRD
      '0x1039BaE6254178EE2f6123cD64CDE9e4CA79D779', // WUKONG
      '0x6942806D1B2d5886D95cE2f04314ece8eb825833', // GROYPER
      '0xA35923162C49cF95e6BF26623385eb431ad920D3', // TURBO
      '0xbA6B0dbb2bA8dAA8F5D6817946393Aef8D3A4487', // HSF
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0x8888888888888e0Ff220b240499E30430458E568', // GEN
      '0x594DaaD7D77592a2b97b725A7AD59D7E188b5bFa', // APU
      '0x5362Ca75aa3c0E714bc628296640C43dc5cb9ED6', // HOSHI
      '0x243cACb4D5fF6814AD668C3e225246efA886AD5a', // SHI
      '0x7A58c0Be72BE218B41C608b7Fe7C5bB630736C71', // PEOPLE
    ],
    portfolio: [
      '1:0x0000000000000000000000000000000000000000', // ETH
      '1:0xB6eD7644C69416d67B522e20bC294A9a9B405B31', // 0xBTC
      '1:0x5026F006B85729a8b14553FAE6af249aD16c9aaB', // WOJAK
      '56:0x0000000000000000000000000000000000000000', // BNB
    ],
  },
}

type Balances = {
  fiatTotal: string
  items: Array<{ tokenInfo: { address: string }; fiatBalance: string }>
}

type Portfolio = {
  totalBalanceFiat: string
  totalTokenBalanceFiat: string
  totalPositionsBalanceFiat: string
  tokenBalances: Array<{ tokenInfo: { chainId: string; address: string }; balanceFiat: string | null }>
}

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

/** Whether a fixture string is a remote image, which stories must load from a local file instead */
export function isRemoteImage(value: string): boolean {
  if (!URL.canParse(value)) {
    return false
  }
  const url = new URL(value)
  return (url.protocol === 'https:' || url.protocol === 'http:') && IMAGE_EXTENSION.test(url.pathname)
}

/** The URL to download a remote image from: TokenIcon shows CoinGecko's larger 'small' variant of a 'thumb' */
export function imageSource(value: string): URL {
  const url = new URL(value)
  if (url.hostname === 'assets.coingecko.com') {
    url.pathname = url.pathname.replace('/thumb/', '/small/')
  }
  return url
}

/** The path of the local copy of an image in the mock-assets folder: its host and path, as WebP */
export function localImagePath(url: URL): string {
  const pathname = decodeURIComponent(url.pathname)
    .replace(/\((\w*)\)/g, '-$1')
    .replace(IMAGE_EXTENSION, '.webp')
  const relative = `${url.hostname}${pathname}`

  // A name that differs only in case is the same file on macOS, so reuse the committed spelling
  const dir = path.posix.dirname(relative)
  const name = path.posix.basename(relative).toLowerCase()
  const absoluteDir = path.join(MOCK_ASSETS_DIR, dir)
  const existing = fs.existsSync(absoluteDir)
    ? fs.readdirSync(absoluteDir).find((entry) => entry.toLowerCase() === name)
    : undefined
  return existing ? path.posix.join(dir, existing) : relative
}

/** Downloads an image, or returns undefined when the host does not have it */
async function downloadImage(url: URL): Promise<Buffer | undefined> {
  const response = await fetch(url)
  if (MISSING_IMAGE_STATUSES.has(response.status)) {
    return undefined
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} from ${url}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

const resizeImage = (input: Buffer | string, size: number) =>
  sharp(input).resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })

/** The local reference for a remote image; saves a 128 px WebP copy the first time a file is needed */
async function localImage(value: string, asDataUri: boolean): Promise<string> {
  const url = imageSource(value)
  const relative = localImagePath(url)
  const file = path.join(MOCK_ASSETS_DIR, relative)
  const committed = fs.existsSync(file)
  const bytes = committed ? undefined : await downloadImage(url)

  if (!committed && !bytes) {
    console.log(`  ! No image at ${url}, using the placeholder`)
    return PLACEHOLDER_IMAGE
  }
  if (asDataUri) {
    const webp = await resizeImage(bytes ?? file, 64)
      .webp({ quality: 80 })
      .toBuffer()
    return `data:image/webp;base64,${webp.toString('base64')}`
  }
  if (bytes) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    await resizeImage(bytes, 128).webp({ quality: 82 }).toFile(file)
    console.log(`  ✓ Saved mock-assets/${relative}`)
  }
  return `mock-assets/${relative}`
}

const localImages = new Map<string, Promise<string>>()

/** Replaces every remote image in a fixture with a local file, a data URI or the placeholder */
export async function localizeImages(value: unknown, key = ''): Promise<unknown> {
  if (typeof value === 'string') {
    if (!isRemoteImage(value)) {
      return value
    }
    const asDataUri = DATA_URI_KEYS.has(key)
    const cacheKey = `${asDataUri} ${value}`
    if (!localImages.has(cacheKey)) {
      localImages.set(cacheKey, localImage(value, asDataUri))
    }
    return localImages.get(cacheKey)
  }
  // One at a time, so the image hosts do not rate-limit a full fetch
  if (Array.isArray(value)) {
    const items: unknown[] = []
    for (const item of value) {
      items.push(await localizeImages(item, key))
    }
    return items
  }
  if (value !== null && typeof value === 'object') {
    const entries: Array<[string, unknown]> = []
    for (const [childKey, child] of Object.entries(value)) {
      entries.push([childKey, await localizeImages(child, childKey)])
    }
    return Object.fromEntries(entries)
  }
  return value
}

const sumFiat = (values: Array<string | null>): string => String(values.reduce((sum, value) => sum + Number(value), 0))

/** Keeps the listed tokens in their original order, with the total of what is left */
export function trimBalances(balances: Balances, addresses: readonly string[]): Balances {
  const items = balances.items.filter(({ tokenInfo }) => addresses.includes(tokenInfo.address))
  return { ...balances, items, fiatTotal: sumFiat(items.map(({ fiatBalance }) => fiatBalance)) }
}

/** Keeps the listed tokens; the positions and their total stay as they are */
export function trimPortfolio(portfolio: Portfolio, tokens: readonly string[]): Portfolio {
  const tokenBalances = portfolio.tokenBalances.filter(({ tokenInfo }) =>
    tokens.includes(`${tokenInfo.chainId}:${tokenInfo.address}`),
  )
  const totalTokenBalanceFiat = sumFiat(tokenBalances.map(({ balanceFiat }) => balanceFiat))
  return {
    ...portfolio,
    totalBalanceFiat: sumFiat([totalTokenBalanceFiat, portfolio.totalPositionsBalanceFiat]),
    totalTokenBalanceFiat,
    tokenBalances,
  }
}

async function saveFixture(filename: string, data: unknown): Promise<void> {
  const filepath = path.join(FIXTURES_DIR, filename)
  const dir = path.dirname(filepath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filepath, JSON.stringify(await localizeImages(data), null, 2))
  console.log(`  ✓ Saved ${filename}`)
}

async function fetchSafeFixtures(safeKey: SafeKey): Promise<void> {
  const safe = SAFES[safeKey]
  const keptTokens = KEPT_TOKENS[safeKey]
  console.log(`\nFetching fixtures for ${safeKey}: ${safe.description}`)

  try {
    // Portfolio
    const portfolioUrl = `${GATEWAY_URL}${ENDPOINTS.portfolio(safe.address)}`
    const portfolio = (await fetchJson(portfolioUrl)) as Portfolio
    await saveFixture(
      `portfolio/${safeKey}.json`,
      keptTokens ? trimPortfolio(portfolio, keptTokens.portfolio) : portfolio,
    )

    // Balances
    const balancesUrl = `${GATEWAY_URL}${ENDPOINTS.balances(safe.address, safe.chainId)}`
    const balances = (await fetchJson(balancesUrl)) as Balances
    await saveFixture(`balances/${safeKey}.json`, keptTokens ? trimBalances(balances, keptTokens.balances) : balances)

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

// Tests import the transforms above without a fetch
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
