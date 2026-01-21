import type { PropsWithChildren, ReactElement } from 'react'
import { Box, Stack, SvgIcon, Typography, type StackProps } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LockIcon from '@/public/images/common/lock-small.svg'

/**
 * Displays a disabled analysis group card that shows the children content as a title and a lock icon.
 */
export const AnalysisGroupCardDisabled = ({ children, ...props }: PropsWithChildren<StackProps>): ReactElement => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ padding: '12px' }} {...props}>
      <Stack direction="row" alignItems="center" gap={1}>
        <SvgIcon component={LockIcon} inheritViewBox sx={{ width: 16, height: 16, color: 'text.disabled' }} />
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
