import { Stack, Box, Typography, Tooltip } from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { getIndexingStatus } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import ExternalLink from '@/components/common/ExternalLink'
import useIntervalCounter from '@/hooks/useIntervalCounter'

const STATUS_PAGE = 'https://status.safe.global'
const MAX_SYNC_DELAY = 1000 * 60 * 5 // 5 minutes
const POLL_INTERVAL = 1000 * 60 // 1 minute

const useIndexingStatus = () => {
  const chainId = useChainId()
  const [count] = useIntervalCounter(POLL_INTERVAL)

  return useAsync(
    () => {
      if (count === undefined) return
      return getIndexingStatus(chainId)
    },
    [chainId, count],
    false,
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
  const [data] = useIndexingStatus()

  if (!data) {
    return null
  }

  const status = getStatus(data.synced, data.lastSync)

  const time = formatDistanceToNow(data.lastSync, { addSuffix: true })

  return (
    <Tooltip title={`Last synced with the blockchain ${time}`} placement="right" arrow>
      <Stack data-testid="index-status" direction="row" spacing={2} alignItems="center" px={3} py={1.5}>
        <Box width={10} height={10} borderRadius="50%" border={`2px solid var(--color-${status.color}-main)`} />

        <ExternalLink href={STATUS_PAGE} noIcon flex={1}>
          <Typography variant="body2">{status.text}</Typography>
        </ExternalLink>

        <ExternalLink href={STATUS_PAGE} sx={{ color: 'text.secondary', transform: 'translateY(3px)' }}>
          {' '}
        </ExternalLink>
      </Stack>
    </Tooltip>
  )
}

export default IndexingStatus
