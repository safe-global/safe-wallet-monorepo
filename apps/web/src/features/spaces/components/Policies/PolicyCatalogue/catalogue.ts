import { MessageSquarePlus, UserRoundPen, WalletCards, type LucideIcon } from 'lucide-react'

export type PolicyCatalogueId = 'spending-limit' | 'proposer' | 'suggestion'

export interface PolicyCatalogueEntry {
  id: PolicyCatalogueId
  title: string
  description: string
  Icon: LucideIcon
  action: string
}

export const POLICY_CATALOGUE: PolicyCatalogueEntry[] = [
  {
    id: 'spending-limit',
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
    action: 'Set policy',
  },
  {
    id: 'proposer',
    title: 'Proposer',
    description: 'Let teammates without signing rights propose transactions.',
    Icon: UserRoundPen,
    action: 'Set policy',
  },
  {
    id: 'suggestion',
    title: 'Something missing?',
    description: 'Tell us which rules would help you manage your Safe accounts.',
    Icon: MessageSquarePlus,
    action: 'Give feedback',
  },
]
