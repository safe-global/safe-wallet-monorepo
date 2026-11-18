import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { isOptimizedForBatchTransactions } from '@/components/safe-apps/utils'

export type Job = 'grow' | 'trade' | 'pay' | 'govern' | 'build' | 'more'
export type BuiltIn = 'treasury' | 'swap' | 'bridge'
export type AppBadge = 'built-in' | 'safe'
export type AppsGroupBy = 'job' | 'network' | 'pinned'

export type AppRow = {
  id: string
  name: string
  does: string
  job: Job
  chainIds: string[]
  users?: number
  badge?: AppBadge
  builtIn?: BuiltIn
  app?: SafeApp
  custom?: boolean
}

export type AppGroup = { key: string; title: string; rows: AppRow[] }

export const JOB_ORDER: Job[] = ['grow', 'trade', 'pay', 'govern', 'build', 'more']

type Profile = { job: Job; does: string; users?: number; badge?: AppBadge }

/** Mock data: our own one-liners, and relative 90-day use where we have it. */
export const APP_PROFILES: Record<string, Profile> = {
  'Aave v3': { job: 'grow', does: 'Lend and borrow crypto assets', users: 765 },
  'Lido Staking': { job: 'grow', does: 'Stake ETH and hold stETH', users: 180 },
  Kiln: { job: 'grow', does: 'Stake ETH with a validator operator', users: 120 },
  'Yearn Vaults': { job: 'grow', does: 'Earn yield in automated vaults', users: 95 },
  'DeFi Saver': { job: 'grow', does: 'Manage lending positions with automation', users: 88 },
  'Idle v4': { job: 'grow', does: 'Earn yield across lending protocols', users: 40 },
  dHEDGE: { job: 'grow', does: 'Invest in managed on-chain funds', users: 35 },
  'Liquity Frontend': { job: 'grow', does: 'Borrow LUSD against ETH', users: 30 },
  Oasis: { job: 'grow', does: 'Borrow DAI against collateral', users: 28 },
  PoolTogether: { job: 'grow', does: 'Save in prize pools', users: 18 },
  mStable: { job: 'grow', does: 'Earn on stablecoins', users: 12 },
  'Alkemi Earn': { job: 'grow', does: 'Lend and borrow in verified pools', users: 6 },
  CowSwap: { job: 'trade', does: 'Swap with protection from front-running', users: 622 },
  Uniswap: { job: 'trade', does: 'Swap tokens and provide liquidity', users: 355 },
  '1inch Network': { job: 'trade', does: 'Swap at the best rate across exchanges', users: 336 },
  Curve: { job: 'trade', does: 'Swap stablecoins and provide liquidity', users: 140 },
  Balancer: { job: 'trade', does: 'Swap tokens and pool liquidity', users: 70 },
  ParaSwap: { job: 'trade', does: 'Swap through an exchange aggregator', users: 60 },
  Zerion: { job: 'trade', does: 'Track and trade the portfolio', users: 55 },
  'xDai Bridge': { job: 'trade', does: 'Bridge DAI to Gnosis Chain', users: 45 },
  'Ramp Network': { job: 'trade', does: 'Buy crypto with a bank card or transfer', users: 25 },
  Synthetix: { job: 'trade', does: 'Trade synthetic assets', users: 20 },
  Kwenta: { job: 'trade', does: 'Trade perpetual futures', users: 15 },
  '0xPlasma Finance': { job: 'trade', does: 'Swap and bridge across exchanges', users: 8 },
  'CSV Airdrop': { job: 'pay', does: 'Send tokens to many addresses from a CSV', users: 295 },
  Sablier: { job: 'pay', does: 'Stream payments by the second', users: 110 },
  'Request Invoicing': { job: 'pay', does: 'Send and pay crypto invoices', users: 90 },
  LlamaPay: { job: 'pay', does: 'Pay salaries as token streams', users: 65 },
  TokenOps: { job: 'pay', does: 'Vest and send tokens on a schedule', users: 50 },
  'Bitbond Token Tool': { job: 'pay', does: 'Create tokens and send them out', users: 22 },
  'Gnosis Auction Starter': { job: 'pay', does: 'Sell tokens in an auction', users: 10 },
  'Safe{Pass}|{DAO}': { job: 'govern', does: 'Take part in Safe governance and rewards', users: 390 },
  Snapshot: { job: 'govern', does: 'Vote on proposals off-chain', users: 160 },
  Zodiac: { job: 'govern', does: 'Add modules and guards to the Safe', users: 150 },
  'Revoke.cash': { job: 'govern', does: 'Review and revoke token approvals', users: 130 },
  'Zodiac Roles': { job: 'govern', does: 'Give members scoped permissions', users: 85 },
  'Token Approval Manager': { job: 'govern', does: 'Change token allowances in one batch', users: 40 },
  'ENS App': { job: 'govern', does: 'Register and manage ENS names', users: 75 },
  'MetaMask Institutional': { job: 'govern', does: 'Connect the Safe to custody tools', users: 32 },
  'Sygnum Web3 Recovery': { job: 'govern', does: 'Set up account recovery', users: 14 },
  OtoCo: { job: 'govern', does: 'Form a legal entity on-chain', users: 5 },
  'Transaction Builder': { job: 'build', does: 'Compose and batch any contract call', users: 954, badge: 'safe' },
  Furucombo: { job: 'build', does: 'Combine DeFi actions into one transaction', users: 26 },
  'Drain Account': { job: 'build', does: 'Move every asset to another address', users: 20 },
}

const TAG_JOBS: Record<string, Job> = {
  'transaction-builder': 'build',
  Infrastructure: 'build',
  'DAO Tooling': 'govern',
  'safe-governance-app': 'govern',
  DeFi: 'trade',
  'swap-fallback': 'trade',
  onramp: 'trade',
}

const BUILT_IN_CHAINS = ['1', '10', '100', '137', '8453', '42161']

export const BUILT_INS: AppRow[] = [
  {
    id: 'built-in-treasury',
    builtIn: 'treasury',
    name: 'Treasury',
    does: 'Put idle funds to work in vetted yield',
    job: 'grow',
    chainIds: BUILT_IN_CHAINS,
    badge: 'built-in',
  },
  {
    id: 'built-in-swap',
    builtIn: 'swap',
    name: 'Swap',
    does: 'Swap tokens at the best route',
    job: 'trade',
    chainIds: BUILT_IN_CHAINS,
    badge: 'built-in',
  },
  {
    id: 'built-in-bridge',
    builtIn: 'bridge',
    name: 'Bridge',
    does: 'Move funds to this Safe on another network',
    job: 'trade',
    chainIds: BUILT_IN_CHAINS,
    badge: 'built-in',
  },
]

export const jobOf = (app: SafeApp): Job =>
  APP_PROFILES[app.name]?.job ?? app.tags.map((tag) => TAG_JOBS[tag]).find(Boolean) ?? 'more'

export const toRow = (app: SafeApp, custom = false): AppRow => {
  const profile = APP_PROFILES[app.name]
  return {
    id: String(app.id),
    name: app.name,
    does: profile?.does ?? app.description,
    job: jobOf(app),
    chainIds: app.chainIds,
    users: profile?.users,
    badge: profile?.badge,
    app,
    custom,
  }
}

const matchesQuery = (row: AppRow, query: string) =>
  !query || `${row.name} ${row.does}`.toLowerCase().includes(query.trim().toLowerCase())

/** Remote apps arrive already filtered; built-ins and custom apps get the same search, category and batch checks here. */
export const buildRows = ({
  filteredApps,
  customApps,
  query,
  categories,
  batchOnly,
}: {
  filteredApps: SafeApp[]
  customApps: SafeApp[]
  query: string
  categories: string[]
  batchOnly: boolean
}): AppRow[] => {
  const builtIns = categories.length > 0 || batchOnly ? [] : BUILT_INS.filter((row) => matchesQuery(row, query))
  const custom = customApps
    .filter((app) => !batchOnly || isOptimizedForBatchTransactions(app))
    .filter((app) => categories.length === 0 || app.tags.some((tag) => categories.includes(tag)))
    .map((app) => toRow(app, true))
    .filter((row) => matchesQuery(row, query))
  return [...builtIns, ...filteredApps.map((app) => toRow(app)), ...custom]
}

const builtInRank = (row: AppRow) =>
  row.builtIn ? BUILT_INS.findIndex((item) => item.id === row.id) : BUILT_INS.length

const byRank = (a: AppRow, b: AppRow) =>
  builtInRank(a) - builtInRank(b) || (b.users ?? 0) - (a.users ?? 0) || a.name.localeCompare(b.name)

const byNetwork = (rows: AppRow[], chainName: (chainId: string) => string, currentChainId: string): AppGroup[] => {
  const chainIds = [...new Set(rows.flatMap((row) => row.chainIds))]
  return chainIds
    .map((chainId) => ({
      key: `chain-${chainId}`,
      title: chainName(chainId),
      rows: rows.filter((row) => row.chainIds.includes(chainId)),
    }))
    .sort(
      (a, b) =>
        Number(b.key === `chain-${currentChainId}`) - Number(a.key === `chain-${currentChainId}`) ||
        b.rows.length - a.rows.length,
    )
}

export const groupApps = (
  rows: AppRow[],
  groupBy: AppsGroupBy,
  {
    pinnedIds,
    jobTitle,
    chainName,
    currentChainId,
    titles,
  }: {
    pinnedIds: Set<number>
    jobTitle: (job: Job) => string
    chainName: (chainId: string) => string
    currentChainId: string
    titles: { pinned: string; others: string; custom: string }
  },
): AppGroup[] => {
  const listed = rows.filter((row) => !row.custom)
  const isPinned = (row: AppRow) => Boolean(row.app && pinnedIds.has(row.app.id))
  const groups: AppGroup[] =
    groupBy === 'job'
      ? JOB_ORDER.map((job) => ({ key: job, title: jobTitle(job), rows: listed.filter((row) => row.job === job) }))
      : groupBy === 'network'
        ? byNetwork(listed, chainName, currentChainId)
        : [
            { key: 'pinned', title: titles.pinned, rows: listed.filter(isPinned) },
            { key: 'others', title: titles.others, rows: listed.filter((row) => !isPinned(row)) },
          ]
  const custom = { key: 'custom', title: titles.custom, rows: rows.filter((row) => row.custom) }
  return [...groups, custom]
    .filter((group) => group.rows.length > 0)
    .map((group) => ({ ...group, rows: [...group.rows].sort(byRank) }))
}
