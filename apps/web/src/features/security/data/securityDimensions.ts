import { AppRoutes } from '@/config/routes'

export type DimensionCategory = 'account' | 'user'

export type DimensionDef = {
  id: string
  title: string
  shortDescription: string
  fixRoute: string
  ctaLabel: string
  category: DimensionCategory
}

export const DIMENSION_DEFS: Record<string, DimensionDef> = {
  account_setup: {
    id: 'account_setup',
    title: 'Account setup',
    shortDescription: 'Whether the signer threshold is optimal for the number of signers on this Safe.',
    fixRoute: AppRoutes.settings.setup,
    ctaLabel: 'Review setup',
    category: 'account',
  },
  // signer_activity: {
  //   id: 'signer_activity',
  //   title: 'Signer activity',
  //   shortDescription: 'How recently each signer has been active on-chain.',
  //   fixRoute: AppRoutes.settings.setup,
  //   ctaLabel: 'Review signers',
  //   category: 'account',
  // },
  // signer_integrity: {
  //   id: 'signer_integrity',
  //   title: 'Signer integrity',
  //   shortDescription: 'Whether any signers are flagged as compromised or sanctioned.',
  //   fixRoute: AppRoutes.settings.setup,
  //   ctaLabel: 'Review signers',
  //   category: 'account',
  // },
  contract_version: {
    id: 'contract_version',
    title: 'Contract version',
    shortDescription: 'Whether the Safe is running the latest and most secure version.',
    fixRoute: AppRoutes.settings.modules,
    ctaLabel: 'Update',
    category: 'account',
  },
  multichain_setup: {
    id: 'multichain_setup',
    title: 'Multichain setup',
    shortDescription: 'Whether signers are consistent across all networks this Safe is deployed on.',
    fixRoute: AppRoutes.settings.setup,
    ctaLabel: 'Review signers',
    category: 'account',
  },
  modules: {
    id: 'modules',
    title: 'Modules & extensions',
    shortDescription: 'Installed modules and whether they introduce additional risk.',
    fixRoute: AppRoutes.settings.modules,
    ctaLabel: 'Review modules',
    category: 'account',
  },
  guard: {
    id: 'guard',
    title: 'Transaction guard',
    shortDescription: 'Whether a transaction guard is enabled for pre-execution validation.',
    fixRoute: AppRoutes.settings.security,
    ctaLabel: 'Learn more',
    category: 'account',
  },
  pending_tx: {
    id: 'pending_tx',
    title: 'Pending transactions',
    shortDescription: 'Unexecuted transactions that may need review or cleanup.',
    fixRoute: AppRoutes.transactions.queue,
    ctaLabel: 'Review queue',
    category: 'account',
  },
  // token_approvals: {
  //   id: 'token_approvals',
  //   title: 'Token approvals',
  //   shortDescription: 'Active token approvals that grant spending access to other contracts.',
  //   fixRoute: AppRoutes.balances.index,
  //   ctaLabel: 'Review approvals',
  //   category: 'account',
  // },
  transaction_scanning: {
    id: 'transaction_scanning',
    title: 'Transaction scanning',
    shortDescription: 'Whether transactions are scanned for malicious activity before execution.',
    fixRoute: AppRoutes.settings.security,
    ctaLabel: 'Learn more',
    category: 'account',
  },
  fallback_handler: {
    id: 'fallback_handler',
    title: 'Fallback handler',
    shortDescription: 'Whether the fallback handler is a recognized official Safe deployment.',
    fixRoute: AppRoutes.settings.modules,
    ctaLabel: 'Review handler',
    category: 'account',
  },
  recovery: {
    id: 'recovery',
    title: 'Recovery setup',
    shortDescription: 'Whether a recovery mechanism is configured in case signers are lost.',
    fixRoute: AppRoutes.settings.security,
    ctaLabel: 'Set up recovery',
    category: 'account',
  },
  // address_book: {
  //   id: 'address_book',
  //   title: 'Address book',
  //   shortDescription: 'Whether contacts are curated to help prevent address poisoning attacks.',
  //   fixRoute: AppRoutes.spaces.addressBook,
  //   ctaLabel: 'Manage contacts',
  //   category: 'user',
  // },
  // trusted_safe: {
  //   id: 'trusted_safe',
  //   title: 'Trusted list',
  //   shortDescription: 'Whether this Safe is marked as trusted to prevent impersonation.',
  //   fixRoute: AppRoutes.settings.setup,
  //   ctaLabel: 'Review settings',
  //   category: 'user',
  // },
}
