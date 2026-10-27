import {
  FileClock,
  Layers,
  LockKeyholeOpen,
  Settings2,
  UserRoundPen,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { PolicyType } from '../types'

/** One icon per policy type, used by the table rows and the detail panel. */
export const POLICY_ICONS: Record<PolicyType, LucideIcon> = {
  'spending-limit': Wallet,
  recovery: LockKeyholeOpen,
  proposer: UserRoundPen,
  allowlist: Users,
  multisend: Layers,
  'safe-management': Settings2,
  'policy-change': FileClock,
}

export const getPolicyIcon = (type: PolicyType): LucideIcon => POLICY_ICONS[type]
