import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import TransactionsIcon from '@/public/images/transactions/transactions.svg'
import CheckIcon from '@safe-global/views/assets/images/common/check.svg'
import { OrderByOption } from '@/store/orderByPreferenceSlice'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import Track from '@/components/common/Track'

type OrderByButtonProps = {
  orderBy: OrderByOption
  onOrderByChange: (orderBy: OrderByOption) => void
}

const orderByLabels = {
  [OrderByOption.LAST_VISITED]: 'Last visited',
  [OrderByOption.NAME]: 'Name',
  // Manual is only selectable on surfaces that support drag ordering; the label keeps the
  // shared preference readable here (the legacy list falls back to A→Z under Manual).
  [OrderByOption.MANUAL]: 'Manual',
}

const OrderByButton = ({ orderBy: orderBy, onOrderByChange: onOrderByChange }: OrderByButtonProps) => {
  return (
    <div className="flex">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              data-testid="sortby-button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground font-normal"
            />
          }
        >
          <TransactionsIcon className="size-4" />
          <Typography variant="paragraph-small" className="whitespace-nowrap">
            Sort by: {orderByLabels[orderBy]}
          </Typography>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[250px]">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <Track {...OVERVIEW_EVENTS.SORT_SAFES} label={orderByLabels[OrderByOption.LAST_VISITED]}>
            <DropdownMenuItem
              data-testid="last-visited-option"
              onClick={() => onOrderByChange(OrderByOption.LAST_VISITED)}
            >
              <span className="mr-4">{orderByLabels[OrderByOption.LAST_VISITED]}</span>
              {orderBy === OrderByOption.LAST_VISITED && <CheckIcon className="ml-auto size-4" />}
            </DropdownMenuItem>
          </Track>
          <Track {...OVERVIEW_EVENTS.SORT_SAFES} label={orderByLabels[OrderByOption.NAME]}>
            <DropdownMenuItem data-testid="name-option" onClick={() => onOrderByChange(OrderByOption.NAME)}>
              <span>{orderByLabels[OrderByOption.NAME]}</span>
              {orderBy === OrderByOption.NAME && <CheckIcon className="ml-auto size-4" />}
            </DropdownMenuItem>
          </Track>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default OrderByButton
