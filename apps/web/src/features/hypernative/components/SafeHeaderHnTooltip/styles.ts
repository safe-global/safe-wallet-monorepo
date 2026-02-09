import { type SxProps, type Theme } from '@mui/material'

export const safeShieldSvgStyles: SxProps<Theme> = {
  fontSize: 'medium',
  '& .shield-img': {
    fill: 'var(--color-static-text-brand)',
    transition: 'fill 0.2s ease',
  },
  '& .shield-lines': {
    fill: '#121312 !important', // consistent between dark/light modes
    stroke: '#121312 !important',
    transition: 'fill 0.2s ease',
  },
}
