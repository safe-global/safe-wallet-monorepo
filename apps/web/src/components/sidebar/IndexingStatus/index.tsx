import { Box, Tooltip, Button, SvgIcon } from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { getIndexingStatus } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import useIntervalCounter from '@/hooks/useIntervalCounter'
import { OpenInNewRounded } from '@mui/icons-material'

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
      <Button
        size="small"
        href={STATUS_PAGE}
        target="_blank"
        startIcon={
          <Box width={16} height={16} borderRadius="50%" border={`2px solid var(--color-${status.color}-main)`} />
        }
        endIcon={
          <SvgIcon component={OpenInNewRounded} fontSize="small" inheritViewBox sx={{ color: 'border.main', ml: 1 }} />
        }
        sx={{
          fontSize: '12px',
          fontWeight: 'normal',
          p: 1,
          '& .MuiButton-startIcon': { marginLeft: 0 },
          '& .MuiButton-endIcon': { justifySelf: 'flex-end', marginLeft: 'auto' },
        }}
      >
        {status.text}
      </Button>
    </Tooltip>
  )
}

export default IndexingStatus
