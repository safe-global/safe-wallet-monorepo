import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'

/** The `spaceId` URL param, or null outside a Workspace (see {@link useUrlSpaceId}). */
export const useCurrentSpaceId = (): string | null => useUrlSpaceId()
