import type { ReactElement } from 'react'
import { HistoryComingSoon } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueStates'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'

const SpaceTransactionHistory = ({ spaceId }: { spaceId: string }): ReactElement => {
  useTrackOnce(SPACE_EVENTS.TRANSACTIONS_HISTORY_TAB_OPENED, { workspace_id: spaceId })

  return <HistoryComingSoon />
}

export default SpaceTransactionHistory
