import React, { useMemo } from 'react'
import { Text, View, YStack } from 'tamagui'
import { TransactionDetails, MultiSend, NativeToken } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ActionValueDecoded, AddressInfoIndex } from '@safe-global/store/gateway/types'
import { formatVisualAmount, shortenAddress } from '@safe-global/utils/utils/formatters'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { Container } from '@/src/components/Container'
import { useTxTokenInfo } from '@safe-global/utils/hooks/useTxTokenInfo'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChainCurrency } from '@/src/store/chains'
import { Identicon } from '@/src/components/Identicon'

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

interface TxActionItemProps {
  action: ActionValueDecoded | MultiSend
  index: number
  addressInfoIndex?: AddressInfoIndex
  txData: TransactionDetails['txData']
}

const TxActionItem = ({ action, index, addressInfoIndex, txData }: TxActionItemProps) => {
  const valueDecoded = txData?.dataDecoded?.parameters?.[0].valueDecoded
  const tx = Array.isArray(valueDecoded) ? valueDecoded[index] : undefined
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)

  const transferTokenInfo = useTxTokenInfo(
    tx?.data?.toString() || undefined,
    tx?.value || undefined,
    tx?.to || '',
    nativeCurrency as NativeToken,
    txData?.tokenInfoIndex ?? {},
  )

  if (!tx) {
    return null
  }

  return (
    <>
      <View alignItems="center" flexDirection="row" justifyContent="space-between" gap={'$2'} flexWrap="wrap">
        <View flexDirection="row" alignItems="center" gap={'$2'} maxWidth="80%">
          <SafeFontIcon name="transaction-contract" color="$colorSecondary" size={18} />
          <Text>{index + 1}</Text>

          {transferTokenInfo?.tokenInfo?.symbol ? (
            <View flexDirection="row" alignItems="center" gap={'$2'}>
              <Text fontSize="$4" flex={1} numberOfLines={1} ellipsizeMode="tail">
                Send {formatVisualAmount(transferTokenInfo.transferValue, transferTokenInfo?.tokenInfo?.decimals, 6)}{' '}
                {transferTokenInfo.tokenInfo.symbol} to
              </Text>
              <Identicon address={tx.to as `0x${string}`} size={20} />{' '}
              <Text fontSize="$4" numberOfLines={1} ellipsizeMode="tail" flexShrink={1}>
                {shortenAddress(tx.to)}
              </Text>
            </View>
          ) : (
            <Text fontSize="$4" flexShrink={1} flexWrap="wrap">
              {getActionName(action, addressInfoIndex as AddressInfoIndex)}
            </Text>
          )}
        </View>

        <SafeFontIcon name="chevron-right" size={18} />
      </View>
    </>
  )
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
            <TxActionItem txData={txDetails.txData} action={action} index={index} />
          </Container>
        )
      })}
    </YStack>
  )
}
