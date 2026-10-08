import { OrderByOption } from '@/store/orderByPreferenceSlice'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { OrderByButtonView, orderByLabels } from '@views/features/myAccounts/components/OrderByButton/OrderByButtonView'

type OrderByButtonProps = {
  orderBy: OrderByOption
  onOrderByChange: (orderBy: OrderByOption) => void
}

const OrderByButton = ({ orderBy: orderBy, onOrderByChange: onOrderByChange }: OrderByButtonProps) => {
  const handleOrderByChange = (newOrderBy: OrderByOption) => {
    trackEvent({ ...OVERVIEW_EVENTS.SORT_SAFES, label: orderByLabels[newOrderBy] })
    onOrderByChange(newOrderBy)
  }

  return (
    <OrderByButtonView
      orderBy={orderBy}
      onSelectLastVisited={() => handleOrderByChange(OrderByOption.LAST_VISITED)}
      onSelectName={() => handleOrderByChange(OrderByOption.NAME)}
    />
  )
}

export default OrderByButton
