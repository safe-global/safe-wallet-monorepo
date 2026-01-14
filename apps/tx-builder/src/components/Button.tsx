import React, { ReactElement, ReactNode, HTMLAttributes } from 'react'
import ButtonMUI, { ButtonProps as ButtonMUIProps } from '@mui/material/Button'
import { alpha } from '@mui/material/styles'

import styled, { css, DefaultTheme, FlattenInterpolation, ThemeProps } from 'styled-components'
import { Icon, IconProps } from './Icon'

type Colors = 'primary' | 'secondary' | 'error'
type Variations = 'bordered' | 'contained' | 'outlined'

type CustomButtonMuiProps = Omit<ButtonMUIProps, 'size' | 'color' | 'variant'> & {
  to?: string
  component?: ReactNode
}
type LocalProps = {
  children?: ReactNode
  color?: Colors
  variant?: Variations
  iconType?: IconProps['type']
  iconSize?: IconProps['size']
}

type Props = LocalProps & CustomButtonMuiProps & HTMLAttributes<HTMLButtonElement>

const StyledIcon = styled(Icon)<IconProps>`
  margin-right: 5px;
`

const customStyles: {
  [key in Colors]: {
    [key in Variations]: FlattenInterpolation<ThemeProps<DefaultTheme>>
  }
} = {
  primary: {
    contained: css`
      color: ${({ theme }) => theme.palette.background.main};
      background-color: ${({ theme }) => theme.palette.primary.main};
      box-shadow: 1px 2px 10px ${alpha('#28363D', 0.18)};

      &:hover {
        color: ${({ theme }) => theme.palette.background.main};
        background-color: ${({ theme }) => theme.palette.primary.dark};
      }
    `,
    outlined: css`
      color: ${({ theme }) => theme.palette.primary.main};
      background-color: transparent;
      path.icon-color {
        fill: ${({ theme }) => theme.palette.primary.main};
      }

      &.Mui-disabled {
        color: ${({ theme }) => theme.palette.primary.main};
      }

      &:hover {
        color: ${({ theme }) => theme.palette.primary.dark};
      }
    `,
    bordered: css`
      color: ${({ theme }) => theme.palette.primary.main};
      background-color: transparent;
      border: 2px solid ${({ theme }) => theme.palette.primary.main};
      path.icon-color {
        fill: ${({ theme }) => theme.palette.primary.main};
      }

      &.Mui-disabled {
        color: ${({ theme }) => theme.palette.primary.main};
      }

      &:hover {
        background: ${({ theme }) => theme.palette.background.light};
      }
    `,
  },
  secondary: {
    contained: css`
      color: ${({ theme }) => theme.palette.primary.main};
      background-color: ${({ theme }) => theme.palette.secondary.main};
      box-shadow: 1px 2px 10px ${alpha('#28363D', 0.18)};

      path.icon-color {
        fill: ${({ theme }) => theme.palette.primary.main};
      }

      &:hover {
        path.icon-color {
          fill: ${({ theme }) => theme.palette.primary.main};
        }

        background-color: ${({ theme }) => theme.palette.secondary.dark};
      }
    `,
    outlined: css`
      color: ${({ theme }) => theme.palette.secondary.main};
      background-color: transparent;
      path.icon-color {
        fill: ${({ theme }) => theme.palette.secondary.main};
      }

      &.Mui-disabled {
        color: ${({ theme }) => theme.palette.secondary.main};
      }
    `,
    bordered: css`
      color: ${({ theme }) => theme.palette.secondary.main};
      background-color: transparent;
      border: 2px solid ${({ theme }) => theme.palette.secondary.main};
      path.icon-color {
        fill: ${({ theme }) => theme.palette.secondary.main};
      }

      &.Mui-disabled {
        color: ${({ theme }) => theme.palette.secondary.main};
      }
    `,
  },
  error: {
    contained: css`
      color: ${({ theme }) => theme.palette.error.main};
      background-color: ${({ theme }) => theme.palette.error.background};

      &:hover {
        background-color: ${({ theme }) => theme.palette.error.light};
        color: ${({ theme }) => theme.palette.error.dark};
      }
    `,
    outlined: css`
      color: ${({ theme }) => theme.palette.error.main};
      background-color: transparent;
      path.icon-color {
        fill: ${({ theme }) => theme.palette.error.main};
      }

      &.Mui-disabled {
        color: ${({ theme }) => theme.palette.error.main};
      }
    `,
    bordered: css`
      color: ${({ theme }) => theme.palette.error.main};
      background-color: transparent;
      border: 2px solid ${({ theme }) => theme.palette.error.main};
      path.icon-color {
        fill: ${({ theme }) => theme.palette.error.main};
      }

      &.Mui-disabled {
        color: ${({ theme }) => theme.palette.error.main};
      }
    `,
  },
}

const StyledButton = styled(ButtonMUI)<{ $localProps: LocalProps }>`
  && {
    font-weight: 700;
    padding: 8px 1.4rem;
    min-width: 120px;

    &.MuiButton-root {
      text-transform: none;
      border-radius: 8px;
      letter-spacing: 0;
    }

    &.Mui-disabled {
      color: ${({ theme }) => theme.palette.background.main};
    }

    path.icon-color {
      fill: ${({ theme }) => theme.palette.background.main};
    }

    &:disabled {
      opacity: 0.5;
    }

    ${({ $localProps }) => {
      if ($localProps.color !== undefined && $localProps.variant !== undefined) {
        return customStyles[$localProps.color][$localProps.variant]
      }
    }}
  }
`

const Button = ({
  children,
  color = 'primary',
  variant = 'contained',
  iconType,
  iconSize,
  // We need destructuring all LocalProps, remaining props are for CustomButtonMuiProps
  ...buttonMuiProps
}: Props): ReactElement => {
  return (
    <StyledButton className={`${color} ${variant}`} {...buttonMuiProps} $localProps={{ color, variant }}>
      {iconType && iconSize && <StyledIcon size={iconSize} type={iconType} />}
      {children}
    </StyledButton>
  )
}

export default Button
