import type { ReactElement } from 'react'
import React from 'react'
import { ToggleButtonGroup, ToggleButton, toggleButtonGroupClasses, styled, svgIconClasses } from '@mui/material'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
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

export enum View {
  Decoded = 'decoded',
  Raw = 'raw',
}

interface ViewToggleButtonGroupProps {
  value: View
  onChange?: (newView: View) => void
  hasRawData?: boolean
}

export const ViewToggleButtonGroup = ({
  value,
  onChange = () => {},
  hasRawData = true,
}: ViewToggleButtonGroupProps): ReactElement | null => {
  if (!hasRawData) {
    return null
  }

  const changeView = (_: React.MouseEvent, newView: View) => {
    if (newView) {
      onChange(newView)
    }
  }

  return (
    <StyledToggleButtonGroup size="small" value={value} exclusive onChange={changeView} aria-label="text alignment">
      <ToggleButton value={View.Decoded} aria-label="decoded">
        <GridViewRoundedIcon />
      </ToggleButton>
      <ToggleButton value={View.Raw} aria-label="raw">
        <TableRowsRoundedIcon />
      </ToggleButton>
    </StyledToggleButtonGroup>
  )
}
