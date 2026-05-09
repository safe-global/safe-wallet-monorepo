import React from 'react'
import styled from 'styled-components'
import CircularProgress from '@mui/material/CircularProgress'
import { type Theme } from '@mui/material/styles'

const loaderSizes = {
  xxs: '10px',
  xs: '16px',
  sm: '30px',
  md: '50px',
  lg: '70px',
}

type Props = {
  size: keyof typeof loaderSizes
  color?: keyof Theme['palette']
  className?: string
}

const StyledCircularProgress = styled(
  ({ size, className }: Props): React.ReactElement => (
    <CircularProgress size={loaderSizes[size]} className={className} />
  ),
)`
  &.MuiCircularProgress-colorPrimary {
    color: ${({ theme, color = 'primary' }) => theme.palette[color].main};
  }
`

const Loader = ({ className, size, color }: Props): React.ReactElement => (
  <StyledCircularProgress size={size} color={color} className={className} />
)

export default Loader
