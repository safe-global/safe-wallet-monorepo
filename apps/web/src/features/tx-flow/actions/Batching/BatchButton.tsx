import { type SyntheticEvent } from 'react'
import { Box, Button, Divider, SvgIcon, Tooltip } from '@mui/material'
import PlusIcon from '@/public/images/common/plus.svg'
import Track from '@/components/common/Track'
import { BATCH_EVENTS } from '@/services/analytics'

const BatchButton = ({
  onClick,
  disabled,
  tooltip,
}: {
  onClick: (e: SyntheticEvent) => void
  disabled?: boolean
  tooltip?: string
}) => (
  <>
    <Tooltip title={tooltip} placement="top">
      <span>
        <Track {...BATCH_EVENTS.BATCH_APPEND}>
          <Button
            variant="outlined"
            onClick={onClick}
            disabled={disabled}
            sx={{ display: ['none', 'flex'], width: ['100%', '100%', '100%', 'auto'] }}
          >
            <SvgIcon component={PlusIcon} inheritViewBox fontSize="small" sx={{ mr: 1 }} />
            Add to batch
          </Button>
        </Track>
      </span>
    </Tooltip>
    <Box display={['none', 'flex']} flexDirection="column" justifyContent="center" color="border.main">
      {' '}
      <Divider
        sx={{
          '&:before': {
            display: { sx: 'block', lg: 'none' },
          },
        }}
      >
        or
      </Divider>
    </Box>
  </>
)

export default BatchButton
