import type {
  BalanceStatement,
  ReportBar,
  ReportBreakdownLine,
  ReportRow,
  StatementGroup,
} from '@safe-global/views/features/spaces/components/Reports/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

import { SAMPLE_WORKSPACE_NAME, SAMPLE_WORKSPACE_SLUG } from './sampleData'
import {
  assetKey,
  groupTotals,
  isComparable,
  safeKey,
  totalUsd,
  type GroupTotal,
  type Holding,
  type Snapshot,
} from './reportSnapshots'

const NO_CHANGE_SHOWN = '—'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const quantity = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1, minimumFractionDigits: 1 })

export const formatUsd = (value: number): string => usd.format(value).replace('-', '−')

const sign = (value: number): string => (value > 0 ? '+' : '−')

const formatChange = (
  delta: number | undefined,
  base: number,
): Pick<ReportBreakdownLine, 'change' | 'changePercent'> => {
  if (delta === undefined) return { change: NO_CHANGE_SHOWN }
  if (Math.abs(delta) < 0.005) return { change: 'No change' }
  return {
    change: `${sign(delta)}${usd.format(Math.abs(delta))}`,
    changePercent: base > 0 ? `${sign(delta)}${percent.format(Math.abs(delta) / base)}` : undefined,
  }
}

const toLines = (
  current: Snapshot,
  previous: Snapshot | undefined,
  keyOf: (holding: Holding) => string,
  describe: (group: GroupTotal) => Pick<ReportBreakdownLine, 'name' | 'detail' | 'quantity'>,
): ReportBreakdownLine[] => {
  const before = new Map(previous ? groupTotals(previous, keyOf).map((group) => [group.key, group.valueUsd]) : [])
  return groupTotals(current, keyOf).map((group) => ({
    id: group.key,
    ...describe(group),
    ...formatChange(
      previous ? group.valueUsd - (before.get(group.key) ?? 0) : undefined,
      Math.abs(before.get(group.key) ?? 0),
    ),
    value: formatUsd(group.valueUsd),
  }))
}

const safeAccountLines = (current: Snapshot, previous?: Snapshot): ReportBreakdownLine[] => {
  const withHoldings = toLines(current, previous, safeKey, ({ holding }) => ({
    name: holding.safeName,
    detail: shortenAddress(holding.safeAddress),
  }))
  const listed = new Set(withHoldings.map((line) => line.id))
  const withoutHoldings = current.safes
    .filter((safe) => !listed.has(safe.address))
    .map((safe): ReportBreakdownLine => {
      const isUnavailable = current.unreadAddresses.includes(safe.address)
      return {
        id: safe.address,
        name: safe.name,
        detail: shortenAddress(safe.address),
        change: previous && !isUnavailable ? 'No change' : NO_CHANGE_SHOWN,
        value: formatUsd(0),
        isUnavailable,
      }
    })
  return [...withHoldings, ...withoutHoldings]
}

const assetLines = (current: Snapshot, previous?: Snapshot): ReportBreakdownLine[] =>
  toLines(current, previous, assetKey, (group) => ({
    name: group.holding.symbol,
    detail: group.holding.type === 'position' ? `${group.holding.protocol} position` : 'Token',
    quantity: quantity.format(group.quantity),
  }))

export const toReportRows = (snapshots: Snapshot[]): ReportRow[] =>
  snapshots.map((snapshot, index) => {
    const older = snapshots[index + 1]
    const previous = isComparable(snapshot, older) ? older : undefined
    const total = totalUsd(snapshot)
    const read = snapshot.safes.length - snapshot.unreadAddresses.length
    return {
      id: snapshot.month.id,
      label: snapshot.month.label,
      safeAccounts: snapshot.unreadAddresses.length > 0 ? `${read} of ${snapshot.safes.length}` : `${read}`,
      ...formatChange(previous ? total - totalUsd(previous) : undefined, previous ? totalUsd(previous) : 0),
      total: formatUsd(total),
      bySafeAccount: safeAccountLines(snapshot, previous),
      byAsset: assetLines(snapshot, previous),
    }
  })

/** Oldest first, so the chart reads left to right. */
export const toReportBars = (snapshots: Snapshot[]): ReportBar[] => {
  const highest = Math.max(...snapshots.map(totalUsd))
  return [...snapshots].reverse().map((snapshot) => ({
    id: snapshot.month.id,
    label: snapshot.month.shortLabel,
    tooltipTitle: snapshot.month.label,
    value: formatUsd(totalUsd(snapshot)),
    heightPercent: Math.max(4, Math.round((totalUsd(snapshot) / highest) * 75)),
    isCurrent: snapshot.month.id === snapshots[0].month.id,
  }))
}

export const reportFileName = (snapshot: Snapshot): string =>
  `safe-balances_${SAMPLE_WORKSPACE_SLUG}_${snapshot.month.fileDate}.csv`

export const toBalanceStatement = (snapshot: Snapshot): BalanceStatement => {
  const subtotals = new Map(groupTotals(snapshot, safeKey).map((group) => [group.key, group.valueUsd]))
  const groups = snapshot.safes
    .map((safe): StatementGroup & { valueUsd: number } => ({
      id: safe.address,
      name: safe.name,
      address: shortenAddress(safe.address),
      valueUsd: subtotals.get(safe.address) ?? 0,
      subtotal: formatUsd(subtotals.get(safe.address) ?? 0),
      isUnavailable: snapshot.unreadAddresses.includes(safe.address),
      lines: snapshot.holdings
        .filter((holding) => holding.safeAddress === safe.address)
        .map((holding) => ({
          id: `${holding.chainId}|${assetKey(holding)}`,
          asset: holding.symbol,
          protocol: holding.type === 'position' ? holding.protocol : undefined,
          network: holding.network,
          quantity: quantity.format(holding.quantity),
          price: formatUsd(holding.priceUsd),
          value: formatUsd(holding.valueUsd),
        })),
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd)

  return {
    workspaceName: SAMPLE_WORKSPACE_NAME,
    asOf: snapshot.month.asOf,
    total: formatUsd(totalUsd(snapshot)),
    fileName: reportFileName(snapshot),
    groups,
  }
}
