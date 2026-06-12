import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { useChainsGetIndexingStatusV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChainId from '@/hooks/useChainId'
import { ExternalLink } from 'lucide-react'
import { STATUS_PAGE_URL } from '@/config/constants'

const MAX_SYNC_DELAY = 1000 * 60 * 5 // 5 minutes
const POLL_INTERVAL = 1000 * 60 // 1 minute

const useIndexingStatus = () => {
  const chainId = useChainId()

  return useChainsGetIndexingStatusV1Query(
    { chainId },
    {
      pollingInterval: POLL_INTERVAL,
      skipPollingIfUnfocused: true,
    },
  )
}

const STATUSES = {
  synced: {
    color: 'success',
    text: 'Synced',
  },
  slow: {
    color: 'warning',
    text: 'Slow network',
  },
  outOfSync: {
    color: 'error',
    text: 'Out of sync',
  },
}

const getStatus = (synced: boolean, lastSync: number) => {
  let status = STATUSES.outOfSync

  if (synced) {
    status = STATUSES.synced
  } else if (Date.now() - lastSync > MAX_SYNC_DELAY) {
    status = STATUSES.slow
  }

  return status
}

const IndexingStatus = () => {
  const { data, isLoading, isError } = useIndexingStatus()

  if (isLoading || isError || !data) {
    return null
  }

  const status = getStatus(data.synced, data.lastSync)

  const time = formatDistanceToNow(data.lastSync, { addSuffix: true })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            render={<a href={STATUS_PAGE_URL} target="_blank" rel="noopener noreferrer" />}
            data-testid="index-status"
            className="gap-2 p-2 text-xs font-normal"
          >
            <span
              className="size-4 shrink-0 rounded-full border-2"
              style={{ borderColor: `var(--color-${status.color}-main)` }}
            />
            {status.text}
            <ExternalLink className="ml-auto size-4 text-[var(--color-border-main)]" />
          </Button>
        }
      />
      <TooltipContent side="right">{`Last synced with the blockchain ${time}`}</TooltipContent>
    </Tooltip>
  )
}

export default IndexingStatus
