import CopyButton from '@/components/common/CopyButton'
import ExplorerButton from '@/components/common/ExplorerButton'

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
  // CoWSwap doesn't show the 0x at the beginning of a tx
  const truncatedOrderId = orderId.replace('0x', '').slice(0, length)

  return (
    <div className="flex flex-row">
      <span>{truncatedOrderId}</span>
      {showCopyButton && <CopyButton text={orderId} />}
      <div className="text-[var(--color-border-main)]">
        <ExplorerButton href={href} />
      </div>
    </div>
  )
}

export default OrderId
