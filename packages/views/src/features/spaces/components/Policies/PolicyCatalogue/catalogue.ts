import {
  Layers,
  MessageSquarePlus,
  Settings2,
  ShieldCheck,
  UserRoundPen,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type PolicyCatalogueId =
  'recipient-allowlist' | 'spending-limit' | 'proposer' | 'multisend' | 'safe-management' | 'suggestion'

/**
 * The `?policy=` value that opens a tile's builder. Only the guard-based policies have one — the
 * spending limit and proposer grant open a tx flow, and the suggestion tile opens feedback.
 */
export type PolicyWizardId = 'accountRecovery' | 'multisend' | 'safeManagement' | 'cosigner' | 'fallback'

/** The tiles that stand for a policy, as opposed to the suggestion tile. */
export type PolicyId = Exclude<PolicyCatalogueId, 'suggestion'>

export interface PolicyCatalogueEntry {
  id: PolicyCatalogueId
  title: string
  description: string
  Icon: LucideIcon
  action: string
  wizard?: PolicyWizardId
}

export const POLICY_CATALOGUE: PolicyCatalogueEntry[] = [
  {
    id: 'recipient-allowlist',
    title: 'Recipient allowlist',
    description: 'Only let funds go to addresses you approve.',
    Icon: ShieldCheck,
    action: 'Set policy',
  },
  {
    id: 'spending-limit',
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
    action: 'Set policy',
  },
  {
    id: 'proposer',
    title: 'Proposer role',
    description: 'Let teammates without signing rights propose transactions.',
    Icon: UserRoundPen,
    action: 'Set policy',
  },
  {
    id: 'multisend',
    title: 'Batched transactions',
    description: 'Apply your other policies to every call inside a batch, not just the batch itself.',
    Icon: Layers,
    action: 'Set policy',
    wizard: 'multisend',
  },
  {
    id: 'safe-management',
    title: 'Safe management',
    description: 'Choose which signer, module and guard changes this Safe account still allows.',
    Icon: Settings2,
    action: 'Set policy',
    wizard: 'safeManagement',
  },
  {
    id: 'suggestion',
    title: 'Something missing?',
    description: 'Tell us which rules would help you manage your Safe accounts.',
    Icon: MessageSquarePlus,
    action: 'Give feedback',
  },
]
