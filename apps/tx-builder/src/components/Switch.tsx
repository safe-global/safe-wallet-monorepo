import React from 'react'
import SwitchMui from '@mui/material/Switch'
import styled from 'styled-components'
import { alpha } from '@mui/material/styles'

const StyledSwitch = styled(({ ...rest }) => <SwitchMui {...rest} />)`
  && {
    .MuiSwitch-thumb {
      background: ${({ theme, checked }) => (checked ? '#12FF80' : theme.palette.common.white)};
      box-shadow:
        1px 1px 2px rgba(0, 0, 0, 0.2),
        0 0 1px rgba(0, 0, 0, 0.5);
    }

    .MuiSwitch-track {
      background: ${({ theme }) => theme.palette.common.black};
    }

    .MuiIconButton-label,
    .MuiSwitch-colorSecondary.Mui-checked {
      color: ${({ checked, theme }) => (checked ? theme.palette.secondary.dark : '#B2B5B2')};
    }

    .MuiSwitch-colorSecondary.Mui-checked:hover {
      background-color: ${({ theme }) => alpha(theme.palette.secondary.dark, 0.08)};
    }

    .Mui-checked + .MuiSwitch-track {
      background-color: ${({ theme }) => theme.palette.secondary.dark};
    }
  }
`

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
}

const Switch = ({ checked, onChange }: Props): React.ReactElement => {
  const onSwitchChange = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => onChange(checked)

  return <StyledSwitch checked={checked} onChange={onSwitchChange} />
}

export default Switch
