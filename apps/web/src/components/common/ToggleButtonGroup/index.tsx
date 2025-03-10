import type { ReactElement } from 'react'
import React from 'react'
import {
  ToggleButtonGroup as MuiToggleButtonGroup,
  ToggleButton,
  toggleButtonGroupClasses,
  styled,
  svgIconClasses,
} from '@mui/material'

const StyledMuiToggleButtonGroup = styled(MuiToggleButtonGroup)(({ theme }) => ({
  '&': {
    backgroundColor: theme.palette.background.paper,
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
  [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]: {
    marginLeft: -1,
    borderLeft: '1px solid transparent',
  },
  [`& .${svgIconClasses.root}`]: {
    width: 16,
    height: 16,
  },
}))

interface ToggleButtonGroupProps {
  value?: number
  children: ReactElement[]
  onChange?: (newValue: number) => void
}

export const ToggleButtonGroup = ({ value = 0, children, onChange }: ToggleButtonGroupProps): ReactElement | null => {
  const [currentValue, setCurrentValue] = React.useState(value)

  const changeView = (_: React.MouseEvent, newValue: number) => {
    if (newValue != null) {
      setCurrentValue(newValue)
      onChange?.(newValue)
    }
  }

  const childrenArray = React.Children.toArray(children).filter(Boolean)

  return (
    <StyledMuiToggleButtonGroup
      size="small"
      value={currentValue}
      exclusive
      onChange={changeView}
      aria-label="text alignment"
    >
      {childrenArray.map((child, index) => (
        <ToggleButton key={index} value={index}>
          {child}
        </ToggleButton>
      ))}
    </StyledMuiToggleButtonGroup>
  )
}
