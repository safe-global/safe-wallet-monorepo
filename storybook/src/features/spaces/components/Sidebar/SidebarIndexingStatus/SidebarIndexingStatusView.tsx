import type { ReactElement } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import StatusIcon from '@/public/images/sidebar/status.svg'
import css from './styles.module.css'

export type IndexingStatus = 'synced' | 'slow' | 'outOfSync'

const STATUS_LABEL: Record<IndexingStatus, string> = {
  synced: 'Synced',
  slow: 'Network delays',
  outOfSync: 'Out of sync',
}

export type SidebarIndexingStatusViewProps = {
  status: IndexingStatus
  /** Relative time of the last sync, e.g. "2 minutes ago". */
  time: string
  isSafeSidebar: boolean
  statusPageUrl: string
}

export const SidebarIndexingStatusView = ({
  status,
  time,
  isSafeSidebar,
  statusPageUrl,
}: SidebarIndexingStatusViewProps): ReactElement => {
  const tooltipText = isSafeSidebar
    ? `Last synced with the blockchain ${time}`
    : 'Blockchain sync status across networks'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={statusPageUrl}
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
