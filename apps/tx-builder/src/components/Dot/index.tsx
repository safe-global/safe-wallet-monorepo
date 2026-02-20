import React from 'react'
import styled from 'styled-components'
import { type Theme } from '@mui/material/styles'

type Props = {
  className?: string
  color: keyof Theme['palette']
  children?: React.ReactNode
}

const StyledDot = styled.div<Props>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  height: 36px;
  width: 36px;
  background-color: ${({ theme, color }) => theme.palette[color].main};
`

const Dot: React.FC<Props> = ({ children, ...rest }): React.ReactElement => <StyledDot {...rest}>{children}</StyledDot>

export default Dot
