import {
  Layers,
  LockKeyholeOpen,
  MessageSquarePlus,
  Settings2,
  ShieldCheck,
  UserRoundPen,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type AddPolicyId =
  'spending-limit' | 'proposer' | 'suggestion' | 'recovery' | 'recipient-allowlist' | 'multisend' | 'safe-management'

export interface AddPolicyOption {
  id: AddPolicyId
  title: string
  description: string
  Icon: LucideIcon
  disabled?: boolean
  disabledTooltip?: string
}

export const ADD_POLICY_OPTIONS: AddPolicyOption[] = [
  {
    id: 'spending-limit',
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
  },
  {
    id: 'proposer',
    title: 'Proposer role',
    description: 'Let teammates without signing rights propose transactions.',
    Icon: UserRoundPen,
  },
  {
    id: 'multisend',
    title: 'Batched transactions',
    description: 'Apply your other policies to every call inside a batch, not just the batch itself.',
    Icon: Layers,
  },
  {
    id: 'safe-management',
    title: 'Safe management',
    description: 'Choose which signer, module and guard changes this Safe account still allows.',
    Icon: Settings2,
  },
  {
    id: 'suggestion',
    title: 'Suggest the next policy',
    description: 'Tell us which rules would help you manage your Safe Accounts.',
    Icon: MessageSquarePlus,
  },
]

export const RECOVERY_POLICY_OPTION: AddPolicyOption = {
  id: 'recovery',
  title: 'Account recovery',
  description: 'Let recoverers restore access to your Safe Account.',
  Icon: LockKeyholeOpen,
}

export const RECIPIENT_ALLOWLIST_POLICY_OPTION: AddPolicyOption = {
  id: 'recipient-allowlist',
  title: 'Recipient allowlist',
  description: 'Only let funds go to addresses you approve.',
  Icon: ShieldCheck,
}
