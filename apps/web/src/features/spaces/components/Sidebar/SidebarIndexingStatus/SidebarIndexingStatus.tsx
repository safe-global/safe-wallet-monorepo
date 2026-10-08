import type { ReactElement } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useChainsGetIndexingStatusV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChainId from '@/hooks/useChainId'
import { STATUS_PAGE_URL } from '@/config/constants'
import {
  SidebarIndexingStatusView,
  type IndexingStatus,
} from '@views/features/spaces/components/Sidebar/SidebarIndexingStatus/SidebarIndexingStatusView'

const MAX_SYNC_DELAY = 1000 * 60 * 5
const POLL_INTERVAL = 1000 * 60

const getStatus = (synced: boolean, lastSync: number): IndexingStatus => {
  if (synced) return 'synced'
  if (Date.now() - lastSync > MAX_SYNC_DELAY) return 'slow'
  return 'outOfSync'
}

export const SidebarIndexingStatus = ({ isSafeSidebar = true }: { isSafeSidebar?: boolean }): ReactElement | null => {
  const chainId = useChainId()
  const { data, isLoading, isError } = useChainsGetIndexingStatusV1Query(
    { chainId },
    { pollingInterval: POLL_INTERVAL, skipPollingIfUnfocused: true },
  )

  if (isLoading || isError || !data) {
    return null
  }

  return (
    <SidebarIndexingStatusView
      status={getStatus(data.synced, data.lastSync)}
      time={formatDistanceToNow(data.lastSync, { addSuffix: true })}
      isSafeSidebar={isSafeSidebar}
      statusPageUrl={STATUS_PAGE_URL}
    />
  )
}
