import React, { useMemo } from 'react'
import { Text, View, YStack } from 'tamagui'
import { TransactionDetails, MultiSend } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ActionValueDecoded, AddressInfoIndex } from '@safe-global/store/gateway/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { Container } from '@/src/components/Container'

interface TxActionsListProps {
  txDetails: TransactionDetails
}

export const getActionName = (action: ActionValueDecoded | MultiSend, addressInfoIndex?: AddressInfoIndex): string => {
  const contractName = (addressInfoIndex as AddressInfoIndex)?.[action.to]?.name
  let name = shortenAddress(action.to)

  if (action.dataDecoded) {
    name = action.dataDecoded.method
  }

  return contractName ? `${contractName}: ${name}` : action.dataDecoded?.method || 'contract interaction'
}

export function TxActionsList({ txDetails }: TxActionsListProps) {
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { dataDecoded, addressInfoIndex } = txDetails.txData || {}

  const onActionPress = (action: MultiSend) => {
    router.push({
      pathname: '/action-details',
      params: {
        txId,
        actionName: getActionName(action, addressInfoIndex as AddressInfoIndex),
        action: JSON.stringify(action),
      },
    })
  }

  const transaction = dataDecoded?.parameters?.find((action) => action.name === 'transactions' && action.valueDecoded)
  const actions = useMemo(() => {
    return Array.isArray(transaction?.valueDecoded) ? transaction?.valueDecoded : [transaction?.valueDecoded]
  }, [transaction])

  return (
    <YStack gap="$2" padding="$4">
      {actions?.map((action, index) => {
        if (!action || !('operation' in action)) {
          return null
        }
        return (
          <Container
            key={`${getActionName(action, addressInfoIndex as AddressInfoIndex)}-${index}`}
            padding="$42"
            gap="$5"
            borderRadius="$3"
            onPress={() => onActionPress(action)}
          >
            <View alignItems="center" flexDirection="row" justifyContent="space-between" gap={'$2'} flexWrap="wrap">
              <View flexDirection="row" alignItems="center" gap={'$3'} maxWidth="90%">
                <SafeFontIcon name="transaction-contract" color="$colorSecondary" size={18} />
                <Text marginRight={'$2'}>{index + 1}</Text>

                <Text fontSize="$4" flexShrink={1} flexWrap="wrap">
                  {getActionName(action, addressInfoIndex as AddressInfoIndex)}
                </Text>
              </View>

              <SafeFontIcon name="chevron-right" size={18} />
            </View>
          </Container>
        )
      })}
    </YStack>
  )
}
