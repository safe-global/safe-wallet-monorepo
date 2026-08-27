import { LockKeyholeOpen, MessageSquarePlus, UserRoundPen, WalletCards, type LucideIcon } from 'lucide-react'

export type PolicyCatalogueId = 'spending-limit' | 'proposer' | 'account-recovery' | 'suggestion'

export interface PolicyCatalogueEntry {
  id: PolicyCatalogueId
  title: string
  description: string
  Icon: LucideIcon
  isAvailable: boolean
}

export const POLICY_CATALOGUE: PolicyCatalogueEntry[] = [
  {
    id: 'spending-limit',
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
    isAvailable: false,
  },
  {
    id: 'proposer',
    title: 'Proposer',
    description: 'Let teammates without signing rights propose transactions.',
    Icon: UserRoundPen,
    isAvailable: true,
  },
  {
    id: 'account-recovery',
    title: 'Account recovery',
    description: 'Choose a trusted Recoverer to recover your Safe account if you ever lose access.',
    Icon: LockKeyholeOpen,
    isAvailable: false,
  },
  {
    id: 'suggestion',
    title: 'Something missing?',
    description: 'Tell us which rules would help you manage your Safe accounts.',
    Icon: MessageSquarePlus,
    isAvailable: true,
  },
]
