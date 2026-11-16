/**
 * MyAccounts Feature - Public API (v3 Architecture)
 *
 * Core feature for managing user Safe accounts.
 * Always enabled (no feature flag).
 *
 * @example
 * ```typescript
 * // Component access via feature handle
 * import { MyAccountsFeature } from '@/features/myAccounts'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const { AccountItemLink, AccountItemIcon, AccountItemInfo } = useLoadFeature(MyAccountsFeature)
 *   return (
 *     <AccountItemLink href={href}>
 *       <AccountItemIcon address={address} chainId={chainId} />
 *       <AccountItemInfo address={address} chainId={chainId} name={name} />
 *     </AccountItemLink>
 *   )
 * }
 *
 * // Shared Safe data hooks (moved to @/hooks/safes)
 * import { useAllSafes, useAllSafesGrouped, isMultiChainSafeItem } from '@/hooks/safes'
 * ```
 */
import type { FeatureHandle } from '@/features/__core__/types'
import type { MyAccountsContract } from './contract'

// Core feature: always enabled, not gated by a CGW feature flag.
export const MyAccountsFeature: FeatureHandle<MyAccountsContract> = {
  name: 'myAccounts',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: MyAccountsContract }>,
}

// Contract type
export type { MyAccountsContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

// Safe item data hooks

// Navigation and state

// Space accounts data

// Pin actions

// Address safety hooks

// ─────────────────────────────────────────────────────────────────
// PUBLIC COMPONENTS
// ─────────────────────────────────────────────────────────────────

export type { SafeAccountsSelection } from './components/SafeAccountsTable'
export type { AccountLine } from './components/SafeAccountsTable/useSafeAccountRows'
export type { SafeAccountColumnId } from '@safe-global/views/features/myAccounts/components/SafeAccountsTable/columns'

// Public types
export type * from './types'
