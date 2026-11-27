import { useRouter } from 'next/router'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { DEFI_V1_COPY } from '../copy'

/** Pending deposits live in the transaction queue too; this links the two. */
export const TransactionsLink = ({ size = 'xs' }: { size?: 'xs' | 'sm' }) => {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(event) => {
        event.stopPropagation()
        router.push({ pathname: AppRoutes.transactions.queue, query: router.query })
      }}
      data-testid="view-in-transactions"
    >
      {DEFI_V1_COPY.positions.viewInTransactions}
      <ArrowUpRight />
    </Button>
  )
}
