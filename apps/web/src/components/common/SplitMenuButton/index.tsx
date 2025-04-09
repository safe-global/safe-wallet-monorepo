import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import { CircularProgress, Tooltip } from '@mui/material'

export default function SplitMenuButton({
  options,
  disabled = false,
  tooltip,
  onClick,
  onChange,
  selectedOption,
  disabledIndex,
  loading = false,
}: {
  options: string[]
  disabled?: boolean
  tooltip?: string
  onClick?: (option: string, e: SyntheticEvent) => void
  onChange?: (option: string) => void
  selectedOption?: string
  disabledIndex?: number
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (selectedOption) {
      const index = options.indexOf(selectedOption)
      if (index !== -1) {
        setSelectedIndex(index)
      }
    }
  }, [selectedOption, options])

  const handleClick = (e: SyntheticEvent) => {
    onClick?.(options[selectedIndex], e)
  }

  const handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
    setSelectedIndex(index)
    setOpen(false)
    onChange?.(options[index])
  }

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleClose = (event: Event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const maxCharLen = Math.max(...options.map((option) => option.length)) + 2

  return (
    <>
      <ButtonGroup variant="contained" ref={anchorRef} aria-label="Button group with a nested menu">
        <Tooltip title={tooltip} placement="top">
          <span>
            <Button
              onClick={handleClick}
              type="submit"
              disabled={disabled}
              sx={{ minWidth: `${maxCharLen}ch !important` }}
            >
              {loading ? <CircularProgress size={20} /> : options[selectedIndex]}
            </Button>
          </span>
        </Tooltip>

        {options.length > 1 && (
          <Button
            size="small"
            aria-expanded={open ? 'true' : undefined}
            aria-label="select action"
            aria-haspopup="menu"
            onClick={handleToggle}
            sx={{ minWidth: '0 !important', px: 1.5 }}
          >
            <ArrowDropDownIcon />
          </Button>
        )}
      </ButtonGroup>

      <Popper
        sx={{ zIndex: 100 }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        placement="bottom-end"
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: 'center right',
            }}
          >
            <Paper elevation={1}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      selected={index === selectedIndex}
                      disabled={disabledIndex === index}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  )
}
