import { useMemo } from 'react'
import { useRouter } from 'next/router'
import type { LinkProps } from 'next/link'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  type AllSafeItems,
  type MultiChainSafeItem,
  type SafeItem,
  flattenSafeItems,
  isMultiChainSafeItem,
  useGetHref,
} from '@/hooks/safes'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { selectUndeployedSafes } from '@/features/counterfactual/store'
import { isPredictedSafeProps } from '@/features/counterfactual/services'
import { getSafeSetups, getSharedSetup, hasMultiChainAddNetworkFeature } from '@/features/multichain'
import { useSafeSpaces, type SafeSpacesMap } from '@/hooks/useSafeSpaces'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import useChains from '@/hooks/useChains'

export type SafeSortColumn = 'name' | 'threshold' | 'networks' | 'workspaces'

export type AccountContextMenu =
  | { type: 'single'; name: string; address: string; chainId: string; addNetwork: boolean; undeployedSafe: boolean }
  | { type: 'multi'; name: string; address: string; chainIds: string[]; addNetwork: boolean }

/** One rendered table line — a single Safe, a multi-chain parent, or a per-chain child. */
export type AccountLine = {
  key: string
  variant: 'single' | 'group' | 'child'
  /** The item this line was built from — child lines reference their per-chain SafeItem. */
  source: SafeItem | MultiChainSafeItem
  address: string
  chainId: string
  displayName: string
  showAddress: boolean
  expandable: boolean
  /** When set, the Networks cell renders a logo stack for these safes; otherwise a single chain logo. */
  networks?: SafeItem[]
  threshold?: number
  owners?: number
  /** A multi-chain account whose per-chain setups differ — the Threshold cell shows an icon only. */
  thresholdMixed: boolean
  workspaces: GetSpaceResponse[]
  pending: number
  /** Of those pending, how many await the connected wallet's signature — flags the badge with a dot. */
  awaitingConfirmation: number
  balance?: string
  href?: LinkProps['href']
  contextMenu: AccountContextMenu
  /** Whether on-chain data resolved (overview or counterfactual) — drives skeletons vs. blanks. */
  dataLoaded: boolean
  /** Counterfactual Safe not yet deployed here — the Balance cell shows a status badge, not a balance. */
  undeployed: boolean
  /** Activation tx submitted and awaiting execution — the badge reads "Activating" instead of "Inactive". */
  isActivating: boolean
}

export type SafeSortKeys = {
  name: string
  threshold: number | null
  /** Owner count (the N in "M/N") — breaks threshold ties. */
  owners: number | null
  networks: string
  workspaces: number
}

export type AccountGroup = { parent: AccountLine; children: AccountLine[]; sort: SafeSortKeys }

type BuildDeps = {
  overviews: SafeOverview[]
  overviewByKey: Map<string, SafeOverview>
  safeSpaces: SafeSpacesMap
  undeployedSafes: UndeployedSafesState
  chainMap: Record<string, Chain>
  getHref: (chain: Chain, address: string) => LinkProps['href']
}

const overviewKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

/**
 * Network sort key: the chain identity to order the Networks column by (e.g. Ethereum before
 * Polygon), not the number of chains. A multi-chain account is represented by its alphabetically
 * first chain name; chains with no config fall back to their id so they still sort deterministically.
 */
const networkSortKey = (safes: SafeItem[], chainMap: Record<string, Chain>): string => {
  const names = safes.map((s) => (chainMap[s.chainId]?.chainName ?? s.chainId).toLowerCase())
  return names.sort()[0] ?? ''
}

/** Unions workspace memberships across a multi-chain safe's per-chain keys, deduped by space uuid. */
const unionWorkspaces = (safes: SafeItem[], safeSpaces: SafeSpacesMap): GetSpaceResponse[] => {
  const byUuid = new Map<string, GetSpaceResponse>()
  for (const safe of safes) {
    for (const space of safeSpaces[overviewKey(safe.chainId, safe.address)] ?? []) {
      byUuid.set(space.uuid, space)
    }
  }
  return Array.from(byUuid.values())
}

const buildSafeLine = (safe: SafeItem, deps: BuildDeps, variant: 'single' | 'child'): AccountLine => {
  const { chainId, address, isReadOnly, name } = safe
  const chain = deps.chainMap[chainId]
  const overview = deps.overviewByKey.get(overviewKey(chainId, address))
  const undeployed = deps.undeployedSafes[chainId]?.[address]
  const isActivating = undeployed ? undeployed.status.status !== 'AWAITING_EXECUTION' : false
  const setup = getSharedSetup(getSafeSetups([safe], deps.overviews, deps.undeployedSafes))
  const isReplayable =
    hasMultiChainAddNetworkFeature(chain) && !isReadOnly && (!undeployed || !isPredictedSafeProps(undeployed.props))

  return {
    key: `${chainId}:${address}`,
    variant,
    source: safe,
    address,
    chainId,
    displayName: variant === 'child' ? (chain?.chainName ?? shortenAddress(address)) : name || shortenAddress(address),
    showAddress: variant === 'single',
    expandable: false,
    threshold: setup?.threshold,
    owners: setup?.owners.length,
    thresholdMixed: false,
    workspaces: variant === 'child' ? [] : (deps.safeSpaces[overviewKey(chainId, address)] ?? []),
    pending: overview?.queued ?? 0,
    awaitingConfirmation: overview?.awaitingConfirmation ?? 0,
    balance: overview?.fiatTotal,
    href: chain ? deps.getHref(chain, address) : undefined,
    contextMenu: {
      type: 'single',
      name: name ?? '',
      address,
      chainId,
      addNetwork: isReplayable,
      undeployedSafe: Boolean(undeployed),
    },
    dataLoaded: Boolean(overview || undeployed),
    undeployed: Boolean(undeployed),
    isActivating,
  }
}

const buildSingleGroup = (item: SafeItem, deps: BuildDeps): AccountGroup => {
  const parent = buildSafeLine(item, deps, 'single')
  return {
    parent,
    children: [],
    sort: {
      name: (item.name ?? '').toLowerCase(),
      threshold: parent.threshold ?? null,
      owners: parent.owners ?? null,
      networks: networkSortKey([item], deps.chainMap),
      workspaces: parent.workspaces.length,
    },
  }
}

const buildMultiGroup = (item: MultiChainSafeItem, deps: BuildDeps): AccountGroup => {
  const { address, safes, name } = item
  const shared = getSharedSetup(getSafeSetups(safes, deps.overviews, deps.undeployedSafes))
  const overviewsForItem = safes.map((s) => deps.overviewByKey.get(overviewKey(s.chainId, s.address)))
  const workspaces = unionWorkspaces(safes, deps.safeSpaces)
  const children = safes.map((s) => buildSafeLine(s, deps, 'child'))

  const pending = overviewsForItem.reduce((sum, o) => sum + (o?.queued ?? 0), 0)
  const awaitingConfirmation = overviewsForItem.reduce((sum, o) => sum + (o?.awaitingConfirmation ?? 0), 0)
  const fiatValues = overviewsForItem.filter((o): o is SafeOverview => Boolean(o)).map((o) => Number(o.fiatTotal))
  const hasReplayableSafe = safes.some((s) => {
    const undeployed = deps.undeployedSafes[s.chainId]?.[s.address]
    return (
      (!undeployed || !isPredictedSafeProps(undeployed.props)) &&
      hasMultiChainAddNetworkFeature(deps.chainMap[s.chainId])
    )
  })
  const dataLoaded = safes.some((s) =>
    Boolean(deps.overviewByKey.get(overviewKey(s.chainId, s.address)) || deps.undeployedSafes[s.chainId]?.[s.address]),
  )
  // The aggregate shows a balance whenever any chain is deployed; the "Not activated" badge only stands in
  // for the balance when every chain is still counterfactual.
  const isFullyUndeployed = safes.length > 0 && safes.every((s) => deps.undeployedSafes[s.chainId]?.[s.address])
  const isActivating =
    isFullyUndeployed &&
    safes.some((s) => deps.undeployedSafes[s.chainId]?.[s.address]?.status.status !== 'AWAITING_EXECUTION')
  const childThresholds = children.map((c) => c.threshold).filter((t): t is number => t != null)

  const parent: AccountLine = {
    key: address,
    variant: 'group',
    source: item,
    address,
    chainId: safes[0]?.chainId ?? '',
    displayName: name || shortenAddress(address),
    showAddress: true,
    expandable: true,
    networks: safes,
    threshold: shared?.threshold,
    owners: shared?.owners.length,
    thresholdMixed: !shared,
    workspaces,
    pending,
    awaitingConfirmation,
    balance: fiatValues.length ? String(fiatValues.reduce((a, b) => a + b, 0)) : undefined,
    contextMenu: {
      type: 'multi',
      name: name ?? '',
      address,
      chainIds: safes.map((s) => s.chainId),
      addNetwork: hasReplayableSafe,
    },
    dataLoaded,
    undeployed: isFullyUndeployed,
    isActivating,
  }

  return {
    parent,
    children,
    sort: {
      name: (name ?? '').toLowerCase(),
      threshold: shared?.threshold ?? (childThresholds.length ? Math.max(...childThresholds) : null),
      owners: parent.owners ?? null,
      networks: networkSortKey(safes, deps.chainMap),
      workspaces: workspaces.length,
    },
  }
}

/**
 * Enriches grouped Safe items with the data the accounts table sorts and renders by:
 * eagerly fetches Safe overviews for the (small) trusted set and resolves workspace
 * membership, then derives per-account threshold, networks, workspaces, pending and
 * balance. Sort keys are computed at the group level so multi-chain children never
 * detach from their parent when the table re-sorts.
 */
export function useSafeAccountRows(items: AllSafeItems): { groups: AccountGroup[]; isLoading: boolean } {
  const router = useRouter()
  const getHref = useGetHref(router)
  const currency = useAppSelector(selectCurrency)
  const { address: walletAddress } = useWallet() || {}
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { configs } = useChains()
  const { safeSpaces } = useSafeSpaces()

  const deployedSafes = useMemo(
    () => flattenSafeItems(items).filter((s) => !undeployedSafes[s.chainId]?.[s.address]),
    [items, undeployedSafes],
  )

  const { data: overviews, isLoading } = useGetMultipleSafeOverviewsQuery({
    currency,
    walletAddress,
    safes: deployedSafes,
  })

  const chainMap = useMemo(
    () => Object.fromEntries(configs.map((c) => [c.chainId, c])) as Record<string, Chain>,
    [configs],
  )

  const groups = useMemo<AccountGroup[]>(() => {
    const overviewList = overviews ?? []
    const overviewByKey = new Map(overviewList.map((o) => [overviewKey(o.chainId, o.address.value), o]))
    const deps: BuildDeps = { overviews: overviewList, overviewByKey, safeSpaces, undeployedSafes, chainMap, getHref }
    return items.map((item) =>
      isMultiChainSafeItem(item) ? buildMultiGroup(item, deps) : buildSingleGroup(item, deps),
    )
  }, [items, overviews, safeSpaces, undeployedSafes, chainMap, getHref])

  return { groups, isLoading }
}

const compareAddresses = (a: AccountGroup, b: AccountGroup) =>
  a.parent.address.toLowerCase().localeCompare(b.parent.address.toLowerCase())

/**
 * Name column: named accounts sort before unnamed ones (in both directions); unnamed accounts fall
 * back to their address. Within each bucket the order flips with the sort direction, so toggling
 * asc/desc actually reverses an all-unnamed list. Address also breaks ties between equal names.
 */
const compareByName = (a: AccountGroup, b: AccountGroup, order: 'asc' | 'desc') => {
  const an = a.sort.name
  const bn = b.sort.name
  if (an && !bn) return -1
  if (!an && bn) return 1
  const cmp = an && bn ? an.localeCompare(bn) || compareAddresses(a, b) : compareAddresses(a, b)
  return order === 'asc' ? cmp : -cmp
}

/**
 * Threshold column: sorts by required signatures (M), then by owner count (N) so e.g. 2/3 orders
 * before 2/15. Accounts with no known threshold sink to the bottom in both directions.
 */
const compareByThreshold = (a: AccountGroup, b: AccountGroup, order: 'asc' | 'desc') => {
  const at = a.sort.threshold
  const bt = b.sort.threshold
  if (at === null && bt === null) return 0
  if (at === null) return 1
  if (bt === null) return -1
  const cmp = at - bt || (a.sort.owners ?? 0) - (b.sort.owners ?? 0)
  return order === 'asc' ? cmp : -cmp
}

/** Orders groups by a sortable column; empty/unknown values always sink to the bottom. */
export const compareGroups = (a: AccountGroup, b: AccountGroup, orderBy: SafeSortColumn, order: 'asc' | 'desc') => {
  if (orderBy === 'name') return compareByName(a, b, order)
  if (orderBy === 'threshold') return compareByThreshold(a, b, order)

  const av = a.sort[orderBy]
  const bv = b.sort[orderBy]
  const aEmpty = av === null || av === ''
  const bEmpty = bv === null || bv === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1

  const cmp = typeof av === 'string' && typeof bv === 'string' ? av.localeCompare(bv) : av < bv ? -1 : av > bv ? 1 : 0
  return order === 'asc' ? cmp : -cmp
}
