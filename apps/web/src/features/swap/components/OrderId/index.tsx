import CopyButton from '@/components/common/CopyButton'
import { OrderIdView } from '@views/features/swap/components/OrderId/OrderIdView'

const OrderId = ({
  orderId,
  href,
  length = 8,
  showCopyButton = true,
}: {
  orderId: string
  href: string
  length?: number
  showCopyButton?: boolean
}) => {
  return (
    <OrderIdView
      orderId={orderId}
      href={href}
      length={length}
      copyButton={showCopyButton && <CopyButton text={orderId} />}
    />
  )
}

export default OrderId
