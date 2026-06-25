import { useState } from 'react'
import { Box, Button, ListItemText, MenuItem, SvgIcon, Typography } from '@mui/material'
import ContextMenu from '@/components/common/ContextMenu'
import TransactionsIcon from '@/public/images/transactions/transactions.svg'
import CheckIcon from '@/public/images/common/check.svg'
import { OrderByOption, BASIC_SORT_OPTIONS } from '@/store/orderByPreferenceSlice'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'

type OrderByButtonProps = {
  orderBy: OrderByOption
  onOrderByChange: (orderBy: OrderByOption) => void
}

const labelOf = (value: OrderByOption) => BASIC_SORT_OPTIONS.find((option) => option.value === value)?.label ?? ''

const OrderByButton = ({ orderBy, onOrderByChange }: OrderByButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  // This control only offers the basic options; a persisted balance order falls back to the first one.
  const active = BASIC_SORT_OPTIONS.find((option) => option.value === orderBy) ?? BASIC_SORT_OPTIONS[0]

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(undefined)
  }

  const handleOrderByChange = (newOrderBy: OrderByOption.NAME | OrderByOption.LAST_VISITED) => {
    // Skip when the shown option is re-selected, so an order set on another surface isn't overwritten.
    if (newOrderBy !== active.value) {
      trackEvent({ ...OVERVIEW_EVENTS.SORT_SAFES, label: labelOf(newOrderBy) })
      onOrderByChange(newOrderBy)
    }
    handleClose()
  }

  return (
    <Box display="flex">
      <Button
        data-testid="sortby-button"
        onClick={handleClick}
        startIcon={<SvgIcon component={TransactionsIcon} inheritViewBox />}
        sx={{ color: 'primary.light', fontWeight: 'normal' }}
        size="small"
      >
        <Typography variant="body2" noWrap>
          Sort by: {active.label}
        </Typography>
      </Button>

      <ContextMenu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': { minWidth: '250px' },
          '& .Mui-selected, & .Mui-selected:hover': {
            backgroundColor: `background.paper`,
          },
        }}
      >
        <MenuItem disabled>
          <ListItemText>Sort by</ListItemText>
        </MenuItem>
        {/* Items kept explicit to preserve the existing data-testids (last-visited-option / name-option). */}
        <MenuItem
          data-testid="last-visited-option"
          sx={{ borderRadius: 0 }}
          onClick={() => handleOrderByChange(OrderByOption.LAST_VISITED)}
          selected={active.value === OrderByOption.LAST_VISITED}
        >
          <ListItemText sx={{ mr: 2 }}>{labelOf(OrderByOption.LAST_VISITED)}</ListItemText>
          {active.value === OrderByOption.LAST_VISITED && <CheckIcon sx={{ ml: 1 }} />}
        </MenuItem>
        <MenuItem
          data-testid="name-option"
          onClick={() => handleOrderByChange(OrderByOption.NAME)}
          selected={active.value === OrderByOption.NAME}
        >
          <ListItemText>{labelOf(OrderByOption.NAME)}</ListItemText>
          {active.value === OrderByOption.NAME && <CheckIcon sx={{ ml: 1 }} />}
        </MenuItem>
      </ContextMenu>
    </Box>
  )
}

export default OrderByButton
