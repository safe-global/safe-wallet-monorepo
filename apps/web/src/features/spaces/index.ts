/**
 * Spaces Feature - Public API
 *
 * This feature provides collaboration spaces for managing Safe accounts, members, and address books.
 *
 * ## Usage
 *
 * ```typescript
 * import { SpacesFeature, useCurrentSpaceId } from '@/features/spaces'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const feature = useLoadFeature(SpacesFeature)
 *   const spaceId = useCurrentSpaceId()  // Hooks imported directly, always safe
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <feature.SpaceDashboard />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const feature = useLoadFeature(SpacesFeature)
 *
 *   if (feature.$isLoading) return <Skeleton />
 *   if (feature.$isDisabled) return null
 *
 *   return <feature.SpaceDashboard />
 * }
 * ```
 *
 * Components and services are accessed via flat structure from useLoadFeature().
 * Hooks are exported directly (always loaded, not lazy) to avoid Rules of Hooks violations.
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 */

// Feature handle - uses semantic mapping
export { SpacesFeature } from './SpacesFeature'

// Contract type (for type annotations if needed)
export type { SpacesContract } from './contract'

// Domain constants (max accounts/workspaces, shared limit copy)
export { SAFE_ACCOUNTS_LIMIT, SPACES_LIMIT, safeAccountsLimitReachedText } from './constants'

// Hooks exported directly (always loaded, not in contract)
// Keep hooks lightweight - minimal imports, heavy logic in services if needed
export { default as useAddressBookSearch } from './hooks/useAddressBookSearch'
export { useCurrentSpaceId } from './hooks/useCurrentSpaceId'
export {
  useIsCurrentSpaceAtSafeLimit,
  useCurrentSpaceSafeCount,
  useSpaceSafeCount,
} from './hooks/useIsCurrentSpaceAtSafeLimit'
export { default as useFeatureFlagRedirect } from './hooks/useFeatureFlagRedirect'
export { default as useFeatureRedirect } from './hooks/useFeatureRedirect'
export { default as useIsBillingVisible } from './hooks/useIsBillingVisible'
export { default as useBillingFeatureRedirect } from './hooks/useBillingFeatureRedirect'
export { default as useGetSpaceAddressBook } from './hooks/useGetSpaceAddressBook'
export { useMemberNameResolver } from './hooks/useMemberNameResolver'
export { default as useGetSpaceAuditLog } from './hooks/useGetSpaceAuditLog'
export { default as useGetSpaceAuditLogActors } from './hooks/useGetSpaceAuditLogActors'
export { default as useGetAddressBookRequests } from './hooks/useGetAddressBookRequests'
export { useAdminCount, useIsLastActiveAdmin } from './hooks/useIsLastActiveAdmin'
export { default as useIsQualifiedSafe } from './hooks/useIsQualifiedSafe'
export { useMembersSearch } from './hooks/useMembersSearch'
export { default as useTrackSpace } from './hooks/useTrackSpace'

// Hooks from useSpaceMembers.tsx
export {
  useSpaceMembersByStatus,
  useCurrentMembership,
  useCurrentMemberProfile,
  useIsActiveMember,
  useIsAdmin,
  useIsInvited,
  isAdmin,
  isActiveAdmin,
  isInviteExpired,
  MemberStatus,
  MemberRole,
} from './hooks/useSpaceMembers'

// Hooks from useSpaceSafes.tsx
export { useSpaceSafes } from './hooks/useSpaceSafes'

// Hooks from useSpacePendingTransactions.ts
export { useSpacePendingTransactions } from './hooks/useSpacePendingTransactions'

// Store exports (actions, selectors, types)
export {
  ESafeAction,
  openSafeActionsModal,
  closeSafeActionsModal,
  selectSafeActionsModal,
  selectSafeActionsModalOpen,
  selectSafeActionsModalType,
} from './store'

// Public types (compile-time only, no runtime cost)
export { mapSpaceContactsToAddressBookState } from './utils'

// Components consumed from outside the feature
export { HeaderNavigation } from './components/HeaderNavigation'
export { SpacesEnhancedSidebar } from './components/Sidebar/SpacesEnhancedSidebar'
export { default as ConnectWalletHint } from './components/ConnectWalletHint'
export { default as ChainSelectorBlock } from './components/SafeSelectorDropdown/components/ChainSelectorBlock'
export type { ChainSelectorBlockProps } from './components/SafeSelectorDropdown/components/ChainSelectorBlock'
export type { SafeItemData, SafeItemDataChain } from './components/SafeSelectorDropdown/types'
export { default as SafeSelectorDropdown } from './components/SafeSelectorDropdown'
export { default as SafeWidget, WidgetItem } from './components/SafeWidget'
export { default as SafeCardReadOnly } from './components/SafeAccounts/SafeCardReadOnly'
export { default as FiatBalance } from './components/SelectSafesOnboarding/components/FiatBalance'
export { DashboardHeader } from './components/Dashboard/DashboardHeader'
export { default as SpacesLogin } from './components/SpacesLogin'
