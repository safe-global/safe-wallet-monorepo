import { Tooltip, SvgIcon, Box } from '@mui/material'
import WarningIcon from '@/public/images/notifications/warning.svg'

const UntrustedTxWarning = ({ trusted }: { trusted: boolean }) => {
  if (trusted) {
    return null
  }

  return (
    <Box data-testid="warning" gridArea="nonce">
      <Tooltip title={`This token is unfamiliar and may pose risks when interacting with it or involved addresses`}>
        <Box
          lineHeight="16px"
          sx={{
            opacity: 1,
          }}
        >
          <SvgIcon component={WarningIcon} fontSize="small" inheritViewBox color="warning" />
        </Box>
      </Tooltip>
    </Box>
  )
}

export default UntrustedTxWarning
