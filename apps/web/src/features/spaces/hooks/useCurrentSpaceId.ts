import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'

/**
 * The Workspace of this tab: the `spaceId` query param, or null outside a Workspace. It never
 * falls back to stored state, because that state is shared by all tabs.
 */
export const useCurrentSpaceId = (): string | null => useUrlSpaceId()
