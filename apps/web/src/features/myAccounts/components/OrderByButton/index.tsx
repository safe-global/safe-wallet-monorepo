import { useState } from 'react'
import { Box, Button, ListItemText, MenuItem, SvgIcon, Typography } from '@mui/material'
import ContextMenu from '@/components/common/ContextMenu'
import TransactionsIcon from '@/public/images/transactions/transactions.svg'
import CheckIcon from '@/public/images/common/check.svg'
import { OrderByOption } from '@/store/orderByPreferenceSlice'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'

type OrderByButtonProps = {
  orderBy: OrderByOption
  onOrderByChange: (orderBy: OrderByOption) => void
}

const orderByLabels = {
  [OrderByOption.LAST_VISITED]: 'Last visited',
  [OrderByOption.NAME]: 'Name',
}

const OrderByButton = ({ orderBy: orderBy, onOrderByChange: onOrderByChange }: OrderByButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(undefined)
  }

  const handleOrderByChange = (newOrderBy: OrderByOption) => {
    trackEvent({ ...OVERVIEW_EVENTS.SORT_SAFES, label: orderByLabels[newOrderBy] })
    onOrderByChange(newOrderBy)
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
          Sort by: {orderByLabels[orderBy]}
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
        <MenuItem
          data-testid="last-visited-option"
          sx={{ borderRadius: 0 }}
          onClick={() => handleOrderByChange(OrderByOption.LAST_VISITED)}
          selected={orderBy === OrderByOption.LAST_VISITED}
        >
          <ListItemText sx={{ mr: 2 }}>{orderByLabels[OrderByOption.LAST_VISITED]}</ListItemText>
          {orderBy === OrderByOption.LAST_VISITED && <CheckIcon sx={{ ml: 1 }} />}
        </MenuItem>
        <MenuItem
          data-testid="name-option"
          onClick={() => handleOrderByChange(OrderByOption.NAME)}
          selected={orderBy === OrderByOption.NAME}
        >
          <ListItemText>{orderByLabels[OrderByOption.NAME]}</ListItemText>
          {orderBy === OrderByOption.NAME && <CheckIcon sx={{ ml: 1 }} />}
        </MenuItem>
      </ContextMenu>
    </Box>
  )
}

export default OrderByButton
