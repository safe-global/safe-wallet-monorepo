import { LockKeyholeOpen, UserRoundPen, WalletCards, type LucideIcon } from 'lucide-react'
import type { PolicyType } from '../types'

/** One icon per policy type, used by the table rows and the detail panel. */
export const POLICY_ICONS: Record<PolicyType, LucideIcon> = {
  'spending-limit': WalletCards,
  recovery: LockKeyholeOpen,
  proposer: UserRoundPen,
}

export const getPolicyIcon = (type: PolicyType): LucideIcon => POLICY_ICONS[type]
