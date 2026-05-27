import type { ReactElement } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useChainsGetIndexingStatusV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChainId from '@/hooks/useChainId'
import { STATUS_PAGE_URL } from '@/config/constants'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import StatusIcon from '@/public/images/sidebar/status.svg'
import css from './styles.module.css'

const MAX_SYNC_DELAY = 1000 * 60 * 5
const POLL_INTERVAL = 1000 * 60

type Status = 'synced' | 'slow' | 'outOfSync'

const STATUS_LABEL: Record<Status, string> = {
  synced: 'Synced',
  slow: 'Slow network',
  outOfSync: 'Out of sync',
}

const getStatus = (synced: boolean, lastSync: number): Status => {
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

  const status = getStatus(data.synced, data.lastSync)
  const time = formatDistanceToNow(data.lastSync, { addSuffix: true })
  const tooltipText = isSafeSidebar
    ? `Last synced with the blockchain ${time}`
    : 'Blockchain sync status across networks'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={STATUS_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={css.indexingStatusButton}
            data-testid="index-status"
            data-status={status}
            aria-label={`Indexing status: ${STATUS_LABEL[status]}`}
          />
        }
      >
        <StatusIcon className={css.indexingStatusIcon} />
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipText}</TooltipContent>
    </Tooltip>
  )
}
