import type { ReactNode, ReactElement } from 'react'
import React from 'react'
import {
  ToggleButtonGroup as MuiToggleButtonGroup,
  ToggleButton,
  toggleButtonGroupClasses,
  styled,
  svgIconClasses,
  Box,
} from '@mui/material'

// @ts-ignore
const StyledMuiToggleButtonGroup = styled(MuiToggleButtonGroup)(
  ({ theme, invert }: { theme?: any; invert: boolean }) => ({
    '&': {
      backgroundColor: invert ? theme.palette.background.main : theme.palette.background.paper,
    },
    [`& .${toggleButtonGroupClasses.grouped}`]: {
      margin: theme.spacing(0.5),
      padding: theme.spacing(0.5),
      border: 0,
      borderRadius: theme.shape.borderRadius,
      [`&.${toggleButtonGroupClasses.disabled}`]: {
        border: 0,
      },
    },
    [`& .${toggleButtonGroupClasses.selected}`]: {
      backgroundColor: invert ? theme.palette.background.paper : theme.palette.background.main,
    },
    [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]: {
      marginLeft: -1,
      borderLeft: '1px solid transparent',
    },
    [`& .${svgIconClasses.root}`]: {
      width: 16,
      height: 16,
    },
  }),
)

interface ToggleButtonGroupProps {
  value?: number
  children: {
    title: ReactNode
    content: ReactNode
  }[]
  onChange?: (newValue: number) => void
  withBackground?: boolean
}

export const ToggleButtonGroup = ({
  value = 0,
  children,
  onChange,
  withBackground,
}: ToggleButtonGroupProps): ReactElement | null => {
  const [currentValue, setCurrentValue] = React.useState(value)

  const changeView = (_: React.MouseEvent, newValue: number) => {
    if (newValue != null) {
      setCurrentValue(newValue)
      onChange?.(newValue)
    }
  }

  return (
    <StyledMuiToggleButtonGroup
      size="small"
      value={currentValue}
      exclusive
      onChange={changeView}
      aria-label="text alignment"
      invert={!withBackground}
    >
      {children.map(({ title }, index) => (
        <ToggleButton key={index} value={index}>
          <Box px={1}>{title}</Box>
        </ToggleButton>
      ))}
    </StyledMuiToggleButtonGroup>
  )
}
