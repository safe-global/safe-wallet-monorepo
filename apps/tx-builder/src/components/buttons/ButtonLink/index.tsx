import React from 'react'
import styled from 'styled-components'
import { Icon, IconProps, IconType } from '../../Icon'
import Text from '../../Text'
import { TypographyProps } from '@mui/material'
import { type Theme } from '@mui/material/styles'

export interface Props extends React.ComponentPropsWithoutRef<'button'> {
  iconType?: keyof IconType
  iconSize?: IconProps['size']
  textSize?: TypographyProps['variant']
  color: keyof Theme['palette']
  children?: React.ReactNode
}

const StyledButtonLink = styled.button<Props>`
  background: transparent;
  border: none;
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme, color }) => theme.palette[color].main};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  display: flex;
  align-items: center;

  :focus {
    outline: none;
  }
`

const StyledText = styled(Text)`
  margin: 0 4px;
`

const ButtonLink = ({
  iconType,
  iconSize = 'md',
  children,
  textSize = 'body1',
  ...rest
}: Props): React.ReactElement => {
  return (
    <StyledButtonLink {...rest}>
      {iconType && <Icon size={iconSize} color={rest.color} type={iconType} />}
      <StyledText variant={textSize} color={rest.color}>
        {children}
      </StyledText>
    </StyledButtonLink>
  )
}

export default ButtonLink
