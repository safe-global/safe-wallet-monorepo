import type { ReactElement } from 'react'
import { Typography, SvgIcon } from '@mui/material'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { styles } from './constants'

const WarningMessage = ({ message }: { message: string }): ReactElement => {
  return (
    <Typography align="center" variant="body2" sx={styles.warningText}>
      <SvgIcon component={WarningIcon} inheritViewBox fontSize="small" color="error" sx={styles.warningIcon} />{' '}
      {message}
    </Typography>
  )
}

export default WarningMessage
