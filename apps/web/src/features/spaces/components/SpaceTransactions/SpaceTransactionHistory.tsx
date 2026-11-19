import type { ReactElement } from 'react'
import { HistoryComingSoon } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueStates'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'

const SpaceTransactionHistory = (): ReactElement => {
  useTrackOnce(SPACE_EVENTS.TRANSACTIONS_HISTORY_TAB_OPENED)

  return <HistoryComingSoon />
}

export default SpaceTransactionHistory
