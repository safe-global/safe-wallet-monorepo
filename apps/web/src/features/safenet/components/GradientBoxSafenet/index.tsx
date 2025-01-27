import { Box, SvgIcon, Typography } from '@mui/material'
import SafenetIcon from '@/public/images/safenet.svg'
import { type CSSProperties, type ReactNode } from 'react'

const GradientBoxSafenet = ({
  heading,
  children,
  className,
  style,
  variant = 'full',
}: {
  heading?: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  variant?: 'full' | 'bottom'
}) => {
  const br = 'calc(var(--space-1) - 1px)'
  return (
    <Box
      className={className}
      style={{
        background: 'linear-gradient(90deg, #32f970 0%, #eed509 100%)',
        borderRadius: variant === 'full' ? br : `0 0 ${br} ${br}`,
        display: 'flex',
        alignItems: 'stretch',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {variant === 'full' && (
        <Box
          style={{
            color: 'var(--color-static-main)',
            padding: 'calc(var(--space-1) / 2) var(--space-1)',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SvgIcon component={SafenetIcon} inheritViewBox fontSize="small" />
          <Typography variant="h5" fontSize="small">
            {heading ?? 'Powered by Safenet'}
          </Typography>
        </Box>
      )}
      <Box
        style={{
          background: 'var(--color-background-paper)',
          borderRadius: '0 0 var(--space-1) var(--space-1)',
          margin: '0 1px 1px 1px',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default GradientBoxSafenet
