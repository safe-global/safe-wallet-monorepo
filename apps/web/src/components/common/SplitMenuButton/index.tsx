import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import { Box, CircularProgress, Popover, Tooltip } from '@mui/material'

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

  const handleMenuItemClick = (e: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
    e.preventDefault()
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

  return (
    <>
      <ButtonGroup variant="contained" ref={anchorRef} aria-label="Button group with a nested menu" fullWidth>
        <Tooltip title={tooltip} placement="top">
          <Box flex={1}>
            <Button onClick={handleClick} type="submit" disabled={disabled}>
              {loading ? <CircularProgress size={20} /> : options[selectedIndex]}
            </Button>
          </Box>
        </Tooltip>

        {options.length > 1 && (
          <Button
            size="small"
            aria-expanded={open ? 'true' : undefined}
            aria-label="select action"
            aria-haspopup="menu"
            onClick={handleToggle}
            sx={{ minWidth: '0 !important', maxWidth: 48, px: 1.5 }}
          >
            <ArrowDropDownIcon />
          </Button>
        )}
      </ButtonGroup>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{ horizontal: 'right', vertical: -2 }}
        slotProps={{
          root: { slotProps: { backdrop: { sx: { backgroundColor: 'transparent' } } } },
        }}
      >
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
      </Popover>
    </>
  )
}
