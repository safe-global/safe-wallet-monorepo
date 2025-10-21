import { Alert, AlertTitle, Box, SvgIcon, Typography } from '@mui/material'
import InfoOutlinedIcon from '@/public/images/notifications/info.svg'

export const MigrateToL2Information = ({ variant }: { variant: 'history' | 'queue' }) => {
  return (
    <Box>
      <Alert severity="info" icon={<SvgIcon component={InfoOutlinedIcon} color="info" />}>
        <AlertTitle>
          <Typography variant="h5" fontWeight={700}>
            Migration to compatible base contract
          </Typography>
        </AlertTitle>
        <Typography>
          {variant === 'history'
            ? 'This Safe was using an incompatible base contract. This transaction includes the migration to a supported base contract.'
            : 'This Safe is currently using an incompatible base contract. The transaction was automatically modified to first migrate to a supported base contract.'}
        </Typography>
      </Alert>
    </Box>
  )
}
