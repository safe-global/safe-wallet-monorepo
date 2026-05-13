import type { ReactElement } from 'react'
import Box from '@mui/material/Box'

export const CountBadge = ({
  count,
  variant = 'warning',
}: {
  count?: string
  variant?: 'warning' | 'subtle'
}): ReactElement | null =>
  count ? (
    <Box
      component="span"
      sx={{
        color: variant === 'warning' ? 'static.main' : 'text.primary',
        backgroundColor: variant === 'warning' ? 'warning.light' : 'background.main',
        border: variant === 'subtle' ? '1px solid' : undefined,
        borderColor: variant === 'subtle' ? 'background.main' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        fontWeight: 700,
        fontSize: 11,
        minWidth: 20,
        height: 20,
        px: 0.5,
        borderRadius: '10px',
        ml: 3,
      }}
    >
      {count}
    </Box>
  ) : null
