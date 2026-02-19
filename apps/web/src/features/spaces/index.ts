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

import { createFeatureHandle } from '@/features/__core__'
import type { SpacesContract } from './contract'

// Feature handle - uses semantic mapping
export const SpacesFeature = createFeatureHandle<SpacesContract>('spaces')

// Contract type (for type annotations if needed)
export type { SpacesContract } from './contract'

// Hooks exported directly (always loaded, not in contract)
// Keep hooks lightweight - minimal imports, heavy logic in services if needed
export { default as useAddressBookSearch } from './hooks/useAddressBookSearch'
export { useCurrentSpaceId } from './hooks/useCurrentSpaceId'
export { default as useFeatureFlagRedirect } from './hooks/useFeatureFlagRedirect'
export { default as useGetSpaceAddressBook } from './hooks/useGetSpaceAddressBook'
export { useAdminCount, useIsLastActiveAdmin } from './hooks/useIsLastActiveAdmin'
export { default as useIsQualifiedSafe } from './hooks/useIsQualifiedSafe'
export { useMembersSearch } from './hooks/useMembersSearch'
export { default as useTrackSpace } from './hooks/useTrackSpace'

// Hooks from useSpaceMembers.tsx
export {
  useSpaceMembersByStatus,
  useCurrentMembership,
  useIsActiceMember,
  useIsAdmin,
  useIsInvited,
  isAdmin,
  isActiveAdmin,
  MemberStatus,
  MemberRole,
} from './hooks/useSpaceMembers'

// Hooks from useSpaceSafes.tsx
export { useSpaceSafes } from './hooks/useSpaceSafes'

// Public types (compile-time only, no runtime cost)
export { mapSpaceContactsToAddressBookState } from './utils'
