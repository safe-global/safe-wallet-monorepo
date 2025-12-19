import type { PropsWithChildren, ReactElement } from 'react'
import { Box, Stack, SvgIcon, Typography } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LockIcon from '@/public/images/common/lock-small.svg'

/**
 * Displays a disabled analysis group card that shows a title and a lock icon
 *
 * @param title - The title to display
 */
export const AnalysisGroupCardDisabled = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ padding: '12px' }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <SvgIcon
          component={LockIcon}
          inheritViewBox
          sx={({ palette }) => ({ width: 16, height: 16, '& path': { fill: palette.text.disabled } })}
        />
        <Typography variant="body2" color="text.disabled">
          {children}
        </Typography>
      </Stack>

      <Box sx={{ width: 16, height: 16, padding: 0 }}>
        <KeyboardArrowDownIcon sx={({ palette }) => ({ width: 16, height: 16, color: palette.text.disabled })} />
      </Box>
    </Stack>
  )
}
