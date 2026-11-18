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

// Contract type (for type annotations if needed)
export type { SpacesContract } from './contract'

// Domain constants (max accounts/workspaces, shared limit copy)
export { SAFE_ACCOUNTS_LIMIT, SPACES_LIMIT, safeAccountsLimitReachedText } from './constants'

// Hooks exported directly (always loaded, not in contract)
// Keep hooks lightweight - minimal imports, heavy logic in services if needed

export { type SafeSponsoredTxs } from './hooks/useSafeSponsoredTxs'

export { type AddressBookWriteScope } from './hooks/useAddressBookWriteScope'

// Hooks from useSpaceMembers.tsx

// Hooks from useSpaceSafes.tsx

// Hooks from useSpacePendingTransactions.ts

// Store exports (actions, selectors, types)
export {
  ESafeAction,
  openSafeActionsModal,
  closeSafeActionsModal,
  selectSafeActionsModal,
  selectSafeActionsModalOpen,
  selectSafeActionsModalType,
} from '@/features/spaces/store/safeActionsModalSlice'

// Public types (compile-time only, no runtime cost)

// Components consumed from outside the feature
export { HeaderNavigation } from '@/features/spaces/components/HeaderNavigation/HeaderNavigation'

export { SpacesEnhancedSidebar } from '@/features/spaces/components/Sidebar/SpacesEnhancedSidebar/SpacesEnhancedSidebar'

export type { ChainSelectorBlockProps } from './components/SafeSelectorDropdown/components/ChainSelectorBlock'
export type {
  SafeItemData,
  SafeItemDataChain,
  SafeRenameTarget,
} from '@safe-global/views/features/spaces/components/SafeSelectorDropdown/types'
