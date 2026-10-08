import type { ReactNode } from 'react'
import ExplorerButton from '@/components/common/ExplorerButton'

export type OrderIdViewProps = {
  orderId: string
  href: string
  length: number
  copyButton: ReactNode
}

export const OrderIdView = ({ orderId, href, length, copyButton }: OrderIdViewProps) => {
  // CoWSwap doesn't show the 0x at the beginning of a tx
  const truncatedOrderId = orderId.replace('0x', '').slice(0, length)

  return (
    <div className="flex flex-row">
      <span>{truncatedOrderId}</span>
      {copyButton}
      <div className="text-[var(--color-border-main)]">
        <ExplorerButton href={href} />
      </div>
    </div>
  )
}
