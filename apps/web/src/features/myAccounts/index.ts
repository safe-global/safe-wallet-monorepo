import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { MyAccountsContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components when flag is enabled)
// ─────────────────────────────────────────────────────────────────

// Uses FEATURES.MY_ACCOUNTS via mapping in createFeatureHandle
export const MyAccountsFeature = createFeatureHandle<MyAccountsContract>('myAccounts')

// ─────────────────────────────────────────────────────────────────
// PUBLIC COMPONENTS
// ─────────────────────────────────────────────────────────────────

export { AccountItem } from './components/AccountItem'
export { default as AddTrustedSafeDialog } from './components/NonPinnedWarning/AddTrustedSafeDialog'
export { default as SafeAccountsTable } from './components/SafeAccountsTable'
