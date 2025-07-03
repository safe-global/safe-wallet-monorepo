import React, { useMemo } from 'react'
import { View } from 'tamagui'
import { TouchableOpacity } from 'react-native'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { ListTableItem } from '../../../ListTable'
import { Identicon } from '@/src/components/Identicon'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { Address } from '@/src/types/address'

export const useRecipientItem = (order: OrderTransactionInfo): ListTableItem[] => {
  const viewRecipientOnExplorer = useOpenExplorer(order.receiver || '')

  const recipientItem = useMemo(() => {
    const items: ListTableItem[] = []

    if (order.receiver && order.owner !== order.receiver) {
      items.push({
        label: 'Recipient',
        render: () => (
          <View flexDirection="row" alignItems="center" gap="$2">
            <Identicon address={order.receiver as Address} size={24} />
            <EthAddress
              address={order.receiver as Address}
              copy
              textProps={{ fontSize: '$4' }}
              copyProps={{ color: '$textSecondaryLight', size: 14 }}
            />
            <TouchableOpacity onPress={viewRecipientOnExplorer}>
              <SafeFontIcon name="external-link" size={14} color="$textSecondaryLight" />
            </TouchableOpacity>
          </View>
        ),
      })
    }

    return items
  }, [order.receiver, order.owner, viewRecipientOnExplorer])

  return recipientItem
}
