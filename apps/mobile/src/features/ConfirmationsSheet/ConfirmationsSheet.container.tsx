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
import { selectSigners } from '@/src/store/signersSlice'
import { useAppSelector } from '@/src/store/hooks'

export const ConfirmationsSheetContainer = () => {
  const activeSafe = useDefinedActiveSafe()
  const importedSigners = useAppSelector(selectSigners)
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId
  const { data, isLoading } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  const { confirmations, signers, proposer } = data?.detailedExecutionInfo as MultisigExecutionDetails
  const confirmationsMapper = useMemo(() => {
    const mapper = confirmations.reduce((acc, confirmation) => {
      acc.set(confirmation.signer.value as Address, true)

      return acc
    }, new Map<Address, boolean>())

    return mapper
  }, [confirmations])

  const sortedSigners = useMemo(() => {
    return Array.from(signers.values()).sort((a, b) => a.value.toLowerCase().localeCompare(b.value.toLowerCase()))
  }, [signers])

  const getSignerTag = useMemo(() => {
    return (signerAddress: Address): string | undefined => {
      if (importedSigners[signerAddress]?.value) {
        return 'You'
      }

      if (proposer?.value === signerAddress) {
        return 'Creator'
      }
      console.log({ importedSigners, signerAddress })

      return undefined
    }
  }, [proposer, importedSigners])

  const renderItem = useCallback(
    ({ item }: { item: AddressInfo }) => {
      const hasSigned = confirmationsMapper.has(item.value as Address)

      return (
        <View width="100%">
          <SignersCard
            name={item.name || shortenAddress(item.value)}
            getSignerTag={getSignerTag}
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
      items={sortedSigners}
      keyExtractor={({ item }) => item.value}
      renderItem={renderItem}
    />
  )
}
