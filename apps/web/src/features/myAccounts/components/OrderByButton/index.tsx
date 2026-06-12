import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import TransactionsIcon from '@/public/images/transactions/transactions.svg'
import CheckIcon from '@/public/images/common/check.svg'
import { OrderByOption } from '@/store/orderByPreferenceSlice'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'

type OrderByButtonProps = {
  orderBy: OrderByOption
  onOrderByChange: (orderBy: OrderByOption) => void
}

const orderByLabels = {
  [OrderByOption.LAST_VISITED]: 'Most recent',
  [OrderByOption.NAME]: 'Name',
}

const OrderByButton = ({ orderBy: orderBy, onOrderByChange: onOrderByChange }: OrderByButtonProps) => {
  const handleOrderByChange = (newOrderBy: OrderByOption) => {
    trackEvent({ ...OVERVIEW_EVENTS.SORT_SAFES, label: orderByLabels[newOrderBy] })
    onOrderByChange(newOrderBy)
  }

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
          <DropdownMenuItem
            data-testid="last-visited-option"
            onClick={() => handleOrderByChange(OrderByOption.LAST_VISITED)}
          >
            <span className="mr-4">{orderByLabels[OrderByOption.LAST_VISITED]}</span>
            {orderBy === OrderByOption.LAST_VISITED && <CheckIcon className="ml-auto size-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem data-testid="name-option" onClick={() => handleOrderByChange(OrderByOption.NAME)}>
            <span>{orderByLabels[OrderByOption.NAME]}</span>
            {orderBy === OrderByOption.NAME && <CheckIcon className="ml-auto size-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default OrderByButton
