export type OpportunityCategory = 'cash' | 'yield' | 'staking'
export type RiskLevel = 'low' | 'medium' | 'higher'
/** Paid tiers buy a labelled slot, never a better rank. */
export type Placement = 'base' | 'featured' | 'premium' | 'sponsored'
export type Access = 'all' | 'pro'

export type Opportunity = {
  id: string
  name: string
  /** Initials on the opportunity's icon. */
  mark: string
  runBy: string
  curator?: string
  category: OpportunityCategory
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
  /** Safe is paid by this partner, so the fact sheet says so. */
  safeIsPaid?: boolean
}

export type DefiV1Framing = 'treasury' | 'defi'
export type DefiV1Nudge = 'home' | 'assets' | 'off'
export type DefiV1Signing = 'threshold' | 'policy'
/** A: Pro gets KYC and partner listings. B: everything open, Pro pays lower fees. */
export type DefiV1Model = 'A' | 'B'
export type DefiV1Plan = 'free' | 'pro'

export type DefiV1Config = {
  framing: DefiV1Framing
  nudge: DefiV1Nudge
  signing: DefiV1Signing
  model: DefiV1Model
  plan: DefiV1Plan
}
