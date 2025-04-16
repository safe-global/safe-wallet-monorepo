import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import { Box, CircularProgress, ListItemText, Popover, Tooltip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

type Option = {
  id: string
  label?: string
}

export default function SplitMenuButton({
  options,
  disabled = false,
  tooltip,
  onClick,
  onChange,
  selected,
  disabledIndex,
  loading = false,
}: {
  options: Option[]
  disabled?: boolean
  tooltip?: string
  onClick?: (option: Option, e: SyntheticEvent) => void
  onChange?: (option: Option) => void
  selected?: Option['id']
  disabledIndex?: number
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (selected) {
      const index = options.findIndex((option) => option.id === selected)
      if (index !== -1) {
        setSelectedIndex(index)
      }
    }
  }, [selected, options])

  const handleClick = (e: SyntheticEvent) => {
    onClick?.(options[selectedIndex], e)
  }

  const handleMenuItemClick = (e: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
    e.preventDefault()

    if (index !== selectedIndex) {
      setSelectedIndex(index)
      setOpen(false)
      onChange?.(options[index])
    }
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

  const { label, id } = useMemo(() => options[selectedIndex] || {}, [options, selectedIndex])
  const maxCharLen = Math.max(...options.map(({ id, label }) => (label || id).length)) + 2

  return (
    <>
      <ButtonGroup variant="contained" ref={anchorRef} aria-label="Button group with a nested menu" fullWidth>
        <Tooltip title={tooltip} placement="top">
          <Box flex={1}>
            <Button
              data-testid={`combo-submit-${id}`}
              onClick={handleClick}
              type="submit"
              disabled={disabled}
              sx={{ minWidth: `${maxCharLen}ch !important` }}
            >
              {loading ? <CircularProgress size={20} /> : label || id}
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
            disabled={loading}
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
              key={option.id}
              selected={index === selectedIndex}
              disabled={disabledIndex === index}
              onClick={(event) => handleMenuItemClick(event, index)}
              sx={{ gap: 2 }}
            >
              <ListItemText>{option.label || option.id}</ListItemText>
              {index === selectedIndex ? <CheckIcon /> : <Box sx={{ width: 24 }} />}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  )
}
