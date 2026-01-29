import { SvgIcon, Tooltip } from '@mui/material'
import type { ReactElement } from 'react'

import WarningIcon from '@/public/images/notifications/warning.svg'

const RecoveryInfo = ({ isMalicious }: { isMalicious: boolean }): ReactElement | null => {
  if (!isMalicious) {
    return null
  }

  return (
    <Tooltip title="Suspicious activity" placement="top" arrow>
      <span>
        <SvgIcon component={WarningIcon} inheritViewBox color="error" />
      </span>
    </Tooltip>
  )
}

export default RecoveryInfo
