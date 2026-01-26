import { ReactElement } from 'react'
import MUITooltip, { TooltipProps as TooltipPropsMui } from '@mui/material/Tooltip'
import { styled, alpha, type Theme } from '@mui/material/styles'
import { PaletteColor } from '@mui/material/styles/createPalette'

type SizeType = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type TooltipProps = {
  size?: SizeType
  backgroundColor?: keyof Theme['palette']
  textColor?: keyof Theme['palette']
  padding?: string
  border?: string
}

const getPaddingBySize = (size: SizeType): string => {
  switch (size) {
    case 'lg':
      return '8px 16px'
    default:
      return '4px 8px'
  }
}

const getBorderBySize = (size: SizeType): string => {
  switch (size) {
    case 'lg':
      return 'none'
    default:
      return `1px solid #B2B5B2`
  }
}

const getFontInfoBySize = (
  size: SizeType,
): {
  fontSize: string
  lineHeight: string
} => {
  switch (size) {
    case 'lg':
      return {
        fontSize: '14px',
        lineHeight: '20px',
      }
    default:
      return {
        fontSize: '12px',
        lineHeight: '16px',
      }
  }
}

interface StyledTooltipProps {
  backgroundColor?: keyof Theme['palette']
  textColor?: keyof Theme['palette']
  tooltipSize?: SizeType
}

const StyledTooltip = styled(MUITooltip, {
  shouldForwardProp: (prop) => !['backgroundColor', 'textColor', 'tooltipSize'].includes(prop as string),
})<StyledTooltipProps>(({ theme, backgroundColor, textColor, tooltipSize = 'md' }) => ({
  '& .MuiTooltip-popper': {
    zIndex: 2001,
  },
  '& .MuiTooltip-tooltip': {
    backgroundColor:
      backgroundColor && theme.palette[backgroundColor]
        ? (theme.palette[backgroundColor] as PaletteColor).main
        : theme.palette.primary.main,
    boxShadow: `1px 2px 10px ${alpha('#28363D', 0.18)}`,
    border: getBorderBySize(tooltipSize),
    color: textColor ? (theme.palette[textColor] as PaletteColor).main : theme.palette.background.default,
    borderRadius: '4px',
    fontFamily: theme.typography.fontFamily,
    padding: getPaddingBySize(tooltipSize),
    fontSize: getFontInfoBySize(tooltipSize).fontSize,
    lineHeight: getFontInfoBySize(tooltipSize).lineHeight,
  },
  '& .MuiTooltip-arrow': {
    color: backgroundColor ? (theme.palette[backgroundColor] as PaletteColor).main : '#E8E7E6',
    border: 'none',
    '&::before': {
      boxShadow: `1px 2px 10px ${alpha('#28363D', 0.18)}`,
    },
  },
}))

type Props = {
  title: string
  children: ReactElement
} & TooltipProps

export const Tooltip = ({
  title,
  backgroundColor,
  textColor,
  children,
  size,
  ...rest
}: Props & Omit<TooltipPropsMui, 'title'>): ReactElement => {
  return (
    <StyledTooltip title={title} backgroundColor={backgroundColor} textColor={textColor} tooltipSize={size} {...rest}>
      {children}
    </StyledTooltip>
  )
}
