export type OpportunityCategory = 'cash' | 'yield' | 'staking'
/** What kind of product it is, shown as a column so it reads at a glance. */
export type AssetType = 'rwa' | 'lending' | 'staking'
export type RiskLevel = 'low' | 'medium' | 'higher'
/** Paid tiers buy a labelled slot, never a better rank. */
export type Placement = 'base' | 'featured' | 'premium' | 'sponsored'
export type Access = 'all' | 'pro'

export type Opportunity = {
  id: string
  name: string
  /** Initials on the opportunity's icon. */
  mark: string
  logo?: string
  runBy: string
  curator?: string
  category: OpportunityCategory
  type: AssetType
  risk: RiskLevel
  asset: string
  holds: string
  apy: number
  exitLabel: string
  exitShort: string
  exitHours: number
  audits: string[]
  liveSince: string
  chains: string[]
  kyc: boolean
  access: Access
  placement: Placement
  onShelf: boolean
  tvl: number
  /** Paid to the protocol or curator, already in the rate shown. */
  managementFee: number
  protocolFee: string
  yieldSource: string
  operators: string
  /** Safe is paid by this partner, so the fact sheet says so. */
  safeIsPaid?: boolean
}

export type DefiV1Framing = 'treasury' | 'defi'
export type DefiV1Nudge = 'home' | 'assets' | 'off'
export type DefiV1Plan = 'free' | 'pro'
/** One Safe, or every Safe in the workspace. */
export type DefiV1Scope = 'safe' | 'workspace'

export type DefiV1Config = {
  framing: DefiV1Framing
  nudge: DefiV1Nudge
  plan: DefiV1Plan
  scope: DefiV1Scope
}

export type SortKey = 'name' | 'apy' | 'type' | 'exit' | 'position'
export type Sort = { key: SortKey; direction: 'asc' | 'desc' }

export type GroupBy = 'none' | 'asset' | 'type' | 'network'

export type Position = {
  opportunity: Opportunity
  principal: number
  earned: number
  pending: boolean
  safe?: string
}

/** A separate Safe with its own budget and signers, so investing never touches the main Safe. */
export type Operation = {
  id: string
  name: string
  budget: number
  invested: number
  threshold: number
  owners: number
  opportunityIds: string[]
  recurring?: { amount: number; frequency: Frequency }
}

export type Frequency = 'week' | 'month' | 'quarter'

export type Holding = { invested: number; pending: number; earned: number }
