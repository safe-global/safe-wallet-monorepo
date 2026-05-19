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
      onChange?.(options[index])
    }

    setOpen(false)
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

  const buttonSx = {
    backgroundColor: '#121312',
    color: '#ffffff',
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    textTransform: 'none' as const,
    boxShadow: 'none',
    height: '40px',
    '&:hover': {
      backgroundColor: '#1a3d2a',
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      backgroundColor: '#e5e7eb',
      color: '#a1a3a7',
      borderColor: '#e5e7eb',
    },
  }

  return (
    <>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        aria-label="Button group with a nested menu"
        fullWidth
        sx={{
          borderRadius: '8px',
          boxShadow: 'none',
          '& .MuiButtonGroup-grouped:not(:last-of-type)': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <Tooltip title={tooltip} placement="top">
          <Box flex={1}>
            <Button
              data-testid={`combo-submit-${id}`}
              onClick={handleClick}
              type="submit"
              disabled={disabled}
              sx={{
                ...buttonSx,
                minWidth: `${maxCharLen}ch !important`,
                borderRadius: options.length > 1 ? '8px 0 0 8px' : '8px',
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : label || id}
            </Button>
          </Box>
        </Tooltip>

        {options.length > 1 && (
          <Button
            aria-expanded={open ? 'true' : undefined}
            aria-label="select action"
            aria-haspopup="menu"
            onClick={handleToggle}
            disabled={loading}
            data-testid="combo-submit-dropdown"
            sx={{
              ...buttonSx,
              minWidth: '0 !important',
              maxWidth: 48,
              px: 1.5,
              borderRadius: '0 8px 8px 0',
            }}
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
          paper: {
            sx: {
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontFamily: '"DM Sans", sans-serif',
            },
          },
        }}
        data-testid="combo-submit-popover"
      >
        <MenuList autoFocusItem>
          {options.map((option, index) => (
            <MenuItem
              key={option.id}
              selected={index === selectedIndex}
              disabled={disabledIndex === index}
              onClick={(event) => handleMenuItemClick(event, index)}
              sx={{
                gap: 2,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '14px',
                borderRadius: '8px',
                mx: 0.5,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                '&.Mui-selected': {
                  backgroundColor: '#f0fdf4',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: '#f0fdf4',
                },
              }}
            >
              <ListItemText sx={{ fontFamily: '"DM Sans", sans-serif' }}>{option.label || option.id}</ListItemText>
              {index === selectedIndex ? <CheckIcon sx={{ color: '#22c55e' }} /> : <Box sx={{ width: 24 }} />}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  )
}
