/**
 * Spaces Feature - Public API
 *
 * This feature provides collaboration spaces for managing Safe accounts, members, and address books.
 */

export { SpacesFeature } from './SpacesFeature'

export type { SpacesContract } from './contract'

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
export { default as useGetSpaceAddressBook } from './hooks/useGetSpaceAddressBook'
export { useMemberNameResolver } from './hooks/useMemberNameResolver'
export { default as useGetSpaceAuditLog } from './hooks/useGetSpaceAuditLog'
export { default as useGetSpaceAuditLogActors } from './hooks/useGetSpaceAuditLogActors'
export { default as useGetAddressBookRequests } from './hooks/useGetAddressBookRequests'
export { useAdminCount, useIsLastActiveAdmin } from './hooks/useIsLastActiveAdmin'
export { default as useIsQualifiedSafe } from './hooks/useIsQualifiedSafe'
export { useMembersSearch } from './hooks/useMembersSearch'
export { useInviteNotification } from './hooks/useInviteNotification'
export { useWorkspaceAddressBookLabel } from './hooks/useWorkspaceAddressBookLabel'
export { useAddressBookWriteScope, type AddressBookWriteScope } from './hooks/useAddressBookWriteScope'
export { useUpsertWorkspaceSafeName } from './hooks/useUpsertWorkspaceSafeName'
export { default as useTrackSpace } from './hooks/useTrackSpace'

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
  getMemberDisplayName,
  sanitizeMemberAlias,
  MEMBER_ALIAS_MAX_LENGTH,
  MemberStatus,
  MemberRole,
} from './hooks/useSpaceMembers'

export { useSpaceSafes } from './hooks/useSpaceSafes'

export { useSpacePendingTransactions } from './hooks/useSpacePendingTransactions'

export {
  ESafeAction,
  openSafeActionsModal,
  closeSafeActionsModal,
  selectSafeActionsModal,
  selectSafeActionsModalOpen,
  selectSafeActionsModalType,
} from './store'

// Public types (compile-time only, no runtime cost)
export { mapSpaceContactsToAddressBookState, getChainIdsParam } from './utils'

export { HeaderNavigation } from './components/HeaderNavigation'
export { default as HeaderAccountInfo } from './components/HeaderNavigation/HeaderAccountInfo'
export { SpacesEnhancedSidebar } from './components/Sidebar/SpacesEnhancedSidebar'
export { default as ConnectWalletHint } from './components/ConnectWalletHint'
export { default as ChainSelectorBlock } from './components/SafeSelectorDropdown/components/ChainSelectorBlock'
export type { ChainSelectorBlockProps } from './components/SafeSelectorDropdown/components/ChainSelectorBlock'
export type { SafeItemData, SafeItemDataChain, SafeRenameTarget } from './components/SafeSelectorDropdown/types'
export { matchesSafeSearch } from './components/SafeSelectorDropdown/utils'
export { default as SafeSelectorDropdown } from './components/SafeSelectorDropdown'
export { default as SafeWidget, WidgetItem } from './components/SafeWidget'
export { default as SafeCardReadOnly } from './components/SafeAccounts/SafeCardReadOnly'
export { DashboardHeader } from './components/Dashboard/DashboardHeader'
export { default as SpacesLogin } from './components/SpacesLogin'
