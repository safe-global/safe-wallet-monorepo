import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSafeProAccess } from './useSafeProAccess'

/** The Workspace that sees the open Safe's private queue: a Safe Pro Workspace holding the Safe, with PRIVATE_QUEUE on. */
export const usePrivateQueueSpaceId = (): string | undefined => {
  const isPrivateQueueEnabled = useHasFeature(FEATURES.PRIVATE_QUEUE) === true
  const { hasProFeatures, isSafePro, spaceId } = useSafeProAccess()

  if (!isPrivateQueueEnabled || !isSafePro || !hasProFeatures || !spaceId) {
    return undefined
  }
  return spaceId
}
