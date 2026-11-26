import type { ReactElement } from 'react'
import { useSpaceQueue } from '../../hooks/useSpaceQueue'
import UnavailableSafesAlert from './UnavailableSafesAlert'

/**
 * Page status in the header: the Safes whose queue didn't load. Reads the unfiltered queue, the entry the
 * Space poller keeps fresh, so a filter or a search in the table doesn't hide a Safe that failed.
 */
const SpaceQueueLoadStatus = ({ spaceId }: { spaceId: string }): ReactElement | null => {
  const { queue, isStale, isFetching, refetch } = useSpaceQueue(spaceId)

  if (!queue || queue.unavailableSafes.length === 0) return null

  return (
    <UnavailableSafesAlert
      spaceId={spaceId}
      safes={queue.unavailableSafes}
      onRetry={refetch}
      isRetrying={isFetching && !isStale}
    />
  )
}

export default SpaceQueueLoadStatus
