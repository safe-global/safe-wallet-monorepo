import type { LinkProps } from 'next/link'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { MultiChainSafeItem, SafeItem } from '@safe-global/views/hooks/safes/types'

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
