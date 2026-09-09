/**
 * MyAccounts Feature - Public API (v3 Architecture)
 *
 * Core feature for managing user Safe accounts.
 * Feature flag: MY_ACCOUNTS (enabled by default, can be disabled via CGW config)
 */
import { createFeatureHandle } from '@/features/__core__'
import type { MyAccountsContract } from './contract'

// Uses FEATURES.MY_ACCOUNTS via mapping in createFeatureHandle
export const MyAccountsFeature = createFeatureHandle<MyAccountsContract>('myAccounts')

export type { MyAccountsContract } from './contract'

export { useSafeItemData } from './hooks/useSafeItemData'
export { useMultiAccountItemData } from './hooks/useMultiAccountItemData'

export { useVisitedSafes } from './hooks/useVisitedSafes'
export { useNetworksOfSafe } from './hooks/useNetworksOfSafe'

export { default as useSpaceAccountsData } from './hooks/useSpaceAccountsData'

export { usePinActions } from './hooks/usePinActions'

export { default as useNonPinnedSafeWarning } from './hooks/useNonPinnedSafeWarning'
export { default as useSimilarAddressDetection } from './hooks/useSimilarAddressDetection'
export { useTrustSafe } from './hooks/useTrustSafe'

export { AccountItem } from './components/AccountItem'
export { default as AddTrustedSafeDialog } from './components/NonPinnedWarning/AddTrustedSafeDialog'
export { default as SafeAccountsTable } from './components/SafeAccountsTable'
export type { SafeAccountsSelection } from './components/SafeAccountsTable'
export type { AccountLine } from './components/SafeAccountsTable/useSafeAccountRows'
export type { SafeAccountColumnId } from './components/SafeAccountsTable/columns'

export type * from './types'
