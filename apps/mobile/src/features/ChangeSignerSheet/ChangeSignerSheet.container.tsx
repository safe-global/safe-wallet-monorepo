import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import React, { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { Text, View } from 'tamagui'
import { Address } from 'blo'
import { SignerInfo } from '@/src/types/address'
import { selectActiveSigner, setActiveSigner } from '@/src/store/activeSignerSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { useGetBalancesQuery } from '@/src/store/signersBalance'
import { selectChainById } from '@/src/store/chains'
import { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatValue } from '@/src/utils/formatters'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { RouteProp, useRoute } from '@react-navigation/native'
import { extractAppSigners } from '../ConfirmTx/utils'
import { ContactDisplayNameContainer } from '../AddressBook'

export const ChangeSignerSheetContainer = () => {
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const signers = useAppSelector(selectSigners)
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const activeSigner = useAppSelector((state: RootState) => selectActiveSigner(state, activeSafe.address))

  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId
  const { data: txDetails, isLoading: isLoadingTxDetails } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  const detailedExecutionInfo = txDetails?.detailedExecutionInfo as MultisigExecutionDetails

  const storedSigners = useMemo(() => extractAppSigners(signers, detailedExecutionInfo), [txDetails, signers])

  const { data, isLoading } = useGetBalancesQuery({
    addresses: storedSigners?.map((item) => item.value) || [],
    chain: activeChain as ChainInfo,
  })

  const items = useMemo(() => {
    if (!data) {
      return []
    }

    const availableSigners = storedSigners.filter((signer) => {
      return !detailedExecutionInfo?.confirmations?.some((confirmation) => confirmation.signer.value === signer.value)
    })

    return availableSigners?.map((item) => ({
      ...item,
      balance: data[item.value],
    }))
  }, [data, storedSigners, detailedExecutionInfo])

  const onSignerPress = (signer: SignerInfo, onClose: () => void) => () => {
    if (activeSigner.value !== signer.value) {
      dispatch(setActiveSigner({ safeAddress: activeSafe.address, signer }))
    }

    onClose()
  }

  return (
    <SafeBottomSheet
      title="Select signer"
      items={items}
      loading={isLoading || isLoadingTxDetails}
      keyExtractor={({ item }) => item.value}
      renderItem={({ item, onClose }) => (
        <View
          width="100%"
          borderRadius={'$4'}
          backgroundColor={activeSigner?.value === item.value ? '$backgroundSecondary' : 'transparent'}
        >
          <SignersCard
            transparent
            onPress={onSignerPress(item, onClose)}
            name={<ContactDisplayNameContainer address={item.value as Address} />}
            address={item.value as Address}
            rightNode={
              <Text>
                {formatValue(item.balance, activeChain.nativeCurrency.decimals)} {activeChain.nativeCurrency.symbol}
              </Text>
            }
          />
        </View>
      )}
    />
  )
}
