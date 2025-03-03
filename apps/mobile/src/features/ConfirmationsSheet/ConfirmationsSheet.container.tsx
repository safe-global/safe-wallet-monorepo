import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import React, { useCallback, useMemo } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RouteProp, useRoute } from '@react-navigation/native'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { Badge } from '@/src/components/Badge'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { shortenAddress } from '@safe-global/utils/formatters'
import { Address } from '@/src/types/address'
import {
  AddressInfo,
  MultisigExecutionDetails,
  useTransactionsGetTransactionByIdV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const ConfirmationsSheetContainer = () => {
  const activeSafe = useDefinedActiveSafe()
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId
  const { data, isLoading } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  const { confirmations, signers } = data?.detailedExecutionInfo as MultisigExecutionDetails
  const confirmationsMapper = useMemo(() => {
    const mapper = confirmations.reduce((acc, confirmation) => {
      acc.set(confirmation.signer.value as Address, true)

      return acc
    }, new Map<Address, boolean>())

    return mapper
  }, [confirmations])

  const renderItem = useCallback(
    ({ item }: { item: AddressInfo }) => {
      const hasSigned = confirmationsMapper.has(item.value as Address)

      return (
        <View width="100%">
          <SignersCard
            name={item.name || shortenAddress(item.value)}
            address={item.value as Address}
            rightNode={
              <Badge
                circular={false}
                content={
                  <View alignItems="center" flexDirection="row" gap="$1">
                    {hasSigned && <SafeFontIcon size={12} name="check" />}

                    <Text fontWeight={600} color={'$color'}>
                      {hasSigned ? 'Signed' : 'Pending'}
                    </Text>
                  </View>
                }
                themeName={hasSigned ? 'badge_success_variant1' : 'badge_warning_variant1'}
              />
            }
          />
        </View>
      )
    },
    [confirmationsMapper],
  )

  return (
    <SafeBottomSheet
      title="Confirmations"
      loading={isLoading}
      items={signers}
      keyExtractor={({ item }) => item.value}
      renderItem={renderItem}
    />
  )
}
