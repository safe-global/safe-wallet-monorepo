import React, { useMemo } from 'react'

import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { ListTableItem } from '../../../ListTable'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { Address } from '@/src/types/address'
import { AddressDisplay } from '@/src/components/AddressDisplay'

export const useRecipientItem = (order: OrderTransactionInfo): ListTableItem[] => {
  const viewRecipientOnExplorer = useOpenExplorer(order.receiver || '')

  const recipientItem = useMemo(() => {
    const items: ListTableItem[] = []

    if (order.receiver && order.owner !== order.receiver) {
      items.push({
        label: 'Recipient',
        render: () => (
          <AddressDisplay
            address={order.receiver as Address}
            textProps={{ fontSize: '$4' }}
            copyProps={{ size: 14 }}
            externalLinkSize={14}
            onExternalLinkPress={viewRecipientOnExplorer}
          />
        ),
      })
    }

    return items
  }, [order.receiver, order.owner, viewRecipientOnExplorer])

  return recipientItem
}
