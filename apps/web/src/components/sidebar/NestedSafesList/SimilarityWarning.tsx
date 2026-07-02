import { Tooltip, SvgIcon } from '@mui/material'
import type { ReactElement } from 'react'
import WarningIcon from '@/public/images/notifications/warning.svg'

/**
 * Warning chip displayed on addresses that have been flagged for similarity
 * to other addresses in the list (potential address poisoning attack)
 */
export function SimilarityWarning(): ReactElement {
  return (
    <Tooltip title="This address looks similar to another address. Double-check before selecting." placement="top">
      <SvgIcon
        component={WarningIcon}
        inheritViewBox
        fontSize="small"
        sx={{ color: 'error.main', ml: 1, flexShrink: 0 }}
        data-testid="similarity-warning"
      />
    </Tooltip>
  )
}
