import type { ReactElement } from 'react'
import { getTxStatus } from '@/features/transactions/utils'
import { AppRoutes } from '@/config/routes'
import { getEip3770ShortName } from '@safe-global/utils/utils/chains'
import { withSpaceIdInUrl, useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import {
  PendingTxWidgetView,
  type PendingTxWidgetViewItem,
  type SpacePendingTxItem,
} from '@views/features/spaces/components/Dashboard/PendingTxWidgetView'

interface PendingTxWidgetProps {
  transactions: SpacePendingTxItem[]
  loading?: boolean
  error?: string
  onRefresh?: () => void
  onItemClick?: (safeAddress: string, txId: string) => void
}

const PendingTxWidget = ({
  transactions,
  loading = false,
  error,
  onRefresh,
  onItemClick,
}: PendingTxWidgetProps): ReactElement => {
  const isEmpty = transactions.length === 0 && !loading
  const hasError = !!error && !loading
  const spaceId = useUrlSpaceId()

  const items: PendingTxWidgetViewItem[] =
    hasError || isEmpty || loading
      ? []
      : transactions.map((tx) => {
          const shortName = getEip3770ShortName(tx.chainId ?? '')
          const safeParam = shortName && tx.safeAddress ? `${shortName}:${tx.safeAddress}` : undefined
          const href = safeParam
            ? withSpaceIdInUrl(`${AppRoutes.transactions.tx}?id=${tx.transaction.id}&safe=${safeParam}`, spaceId)
            : undefined

          return {
            tx,
            href,
            onClick: tx.safeAddress ? () => onItemClick?.(tx.safeAddress!, tx.transaction.id) : undefined,
            status: getTxStatus(tx),
          }
        })

  return (
    <PendingTxWidgetView items={items} loading={loading} hasError={hasError} isEmpty={isEmpty} onRefresh={onRefresh} />
  )
}

export { PendingTxWidget }
export type { PendingTxWidgetProps }
export default PendingTxWidget
