import React from 'react'
import MuiTooltip from '@mui/material/Tooltip'
import { alpha, styled as muiStyled, type Theme } from '@mui/material/styles'
import { Typography, TypographyProps } from '@mui/material'

type Props = {
  children: React.ReactNode
  tooltip?: string
  color?: keyof Theme['palette'] | 'white'
  className?: string
  component?: 'span' | 'p'
  strong?: boolean
  center?: boolean
}

const StyledTooltip = muiStyled(MuiTooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.common.white,
    color: theme.palette.text.primary,
    boxShadow: `0px 0px 10px ${alpha('#28363D', 0.2)}`,
  },
  '& .MuiTooltip-arrow': {
    color: theme.palette.common.white,
  },
}))

const Text = ({
  children,
  component = 'p',
  tooltip,
  color,
  strong,
  center,
  className,
  ...rest
}: Props & Omit<TypographyProps, 'color'>): React.ReactElement => {
  const textColor = color ? (color === 'white' ? 'common.white' : `${color}.main`) : 'text.primary'

  const TextElement = (
    <Typography
      component={component}
      className={className}
      sx={{
        color: textColor,
        textAlign: center ? 'center' : undefined,
        fontWeight: strong ? 'bold' : undefined,
      }}
      {...rest}
    >
      {children}
    </Typography>
  )

  return tooltip === undefined ? (
    TextElement
  ) : (
    <StyledTooltip title={tooltip} placement="bottom" arrow>
      {TextElement}
    </StyledTooltip>
  )
}

export default Text
