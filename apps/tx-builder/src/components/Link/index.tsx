import React from 'react'
import styled from 'styled-components'
import { type Theme } from '@mui/material/styles'

export interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: keyof Theme['palette'] | 'white'
}

const StyledLink = styled.a<Props>`
  cursor: pointer;
  color: ${({ theme, color = 'primary' }) =>
    color === 'white' ? theme.palette.common.white : theme.palette[color].dark};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  text-decoration: underline;
`

const Link: React.FC<Props> = ({ children, ...rest }): React.ReactElement => {
  return <StyledLink {...rest}>{children}</StyledLink>
}

export default Link
