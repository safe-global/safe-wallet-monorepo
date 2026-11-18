/**
 * Spaces Feature - Public API
 *
 * This feature provides collaboration spaces for managing Safe accounts, members, and address books.
 *
 * ## Usage
 *
 * ```typescript
 * import { SpacesFeature } from '@/features/spaces/SpacesFeature'
 * import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
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

export type { SpacesContract } from './contract'
export type { SafeSponsoredTxs } from './hooks/useSafeSponsoredTxs'
export type { AddressBookWriteScope } from './hooks/useAddressBookWriteScope'
export type { ChainSelectorBlockProps } from './components/SafeSelectorDropdown/components/ChainSelectorBlock'
export type {
  SafeItemData,
  SafeItemDataChain,
  SafeRenameTarget,
} from '@safe-global/views/features/spaces/components/SafeSelectorDropdown/types'
