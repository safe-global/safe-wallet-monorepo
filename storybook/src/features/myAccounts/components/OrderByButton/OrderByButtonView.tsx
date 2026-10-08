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
import type { OrderByOption } from '@/store/orderByPreferenceSlice'

type OrderByValue = `${OrderByOption}`

export const orderByLabels: Record<OrderByValue, string> = {
  lastVisited: 'Last visited',
  name: 'Name',
  // Manual is only selectable on surfaces that support drag ordering; the label keeps the
  // shared preference readable here (the legacy list falls back to A→Z under Manual).
  manual: 'Manual',
}

export type OrderByButtonViewProps = {
  orderBy: OrderByValue
  onSelectLastVisited: () => void
  onSelectName: () => void
}

export const OrderByButtonView = ({ orderBy, onSelectLastVisited, onSelectName }: OrderByButtonViewProps) => {
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
          <DropdownMenuItem data-testid="last-visited-option" onClick={onSelectLastVisited}>
            <span className="mr-4">{orderByLabels.lastVisited}</span>
            {orderBy === 'lastVisited' && <CheckIcon className="ml-auto size-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem data-testid="name-option" onClick={onSelectName}>
            <span>{orderByLabels.name}</span>
            {orderBy === 'name' && <CheckIcon className="ml-auto size-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
