import { ClickAwayListener } from '@mui/material'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import React from 'react'
import styled from 'styled-components'
import FixedIcon from '../FixedIcon'

const StyledMenu = styled(Menu)`
  && {
    .MuiMenu-paper {
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
    }

    .MuiMenu-list {
      div:not(:first-child) {
        border-top: 1px solid ${({ theme }) => theme.palette.divider};
      }
    }
  }
`

const MenuWrapper = styled.div`
  display: flex;
`

const MenuItemWrapper = styled.div`
  :focus {
    outline-color: ${({ theme }) => theme.palette.divider};
  }
`

const IconWrapper = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin: 0;
  border-radius: 50%;
  transition: background-color 0.2s ease-in-out;
  outline-color: transparent;
  height: 24px;
  width: 24px;

  span {
    display: flex;
  }

  :hover {
    background-color: ${({ theme }) => theme.palette.divider};
  }
`

export type EllipsisMenuItem = {
  label: string
  disabled?: boolean
  onClick: () => void
}

type Props = {
  menuItems: EllipsisMenuItem[]
}

const EllipsisMenu = ({ menuItems }: Props): React.ReactElement => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => setAnchorEl(event.currentTarget)

  const closeMenuHandler = () => {
    setAnchorEl(null)
  }

  const onMenuItemClick = (item: EllipsisMenuItem) => {
    item.onClick()
    closeMenuHandler()
  }

  return (
    <ClickAwayListener onClickAway={closeMenuHandler}>
      <MenuWrapper>
        <IconWrapper onClick={handleClick}>
          <FixedIcon type="options" />
        </IconWrapper>
        <StyledMenu anchorEl={anchorEl} keepMounted onClose={closeMenuHandler} open={Boolean(anchorEl)}>
          {menuItems.map((item) => (
            <MenuItemWrapper key={item.label}>
              <MenuItem disabled={item.disabled} onClick={() => onMenuItemClick(item)}>
                {item.label}
              </MenuItem>
            </MenuItemWrapper>
          ))}
        </StyledMenu>
      </MenuWrapper>
    </ClickAwayListener>
  )
}

export default EllipsisMenu
