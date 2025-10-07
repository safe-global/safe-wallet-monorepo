import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import React from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { Text, View } from 'tamagui'
import { Address } from 'blo'
import { SignerInfo } from '@/src/types/address'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { selectChainById } from '@/src/store/chains'
import { ContactDisplayNameContainer } from '../AddressBook'
import { useTxSignerActions } from '../ConfirmTx/hooks/useTxSignerActions'
import useAvailableSigners from '@/src/features/ChangeSignerSheet/useAvailableSigners'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ActionType } from '@/src/features/ChangeSignerSheet/utils'
import { useTransactionData } from '../ConfirmTx/hooks/useTransactionData'
import useGasFee from '../ExecuteTx/hooks/useGasFee'
import { selectEstimatedFee } from '@/src/store/estimatedFeeSlice'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { toBigInt } from 'ethers'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'

const getActiveSignerRightNode = (
  totalFee: bigint,
  item: SignerInfo & { balance: string },
  activeSigner?: SignerInfo,
) => {
  if (activeSigner?.value === item.value) {
    return <SafeFontIcon name="check" color="$color" />
  }

  return toBigInt(item.balance) < totalFee && <Text>Insufficient balance</Text>
}

export const ChangeSignerSheetContainer = () => {
  const routeParams = useRoute<RouteProp<{ params: { txId: string; actionType: ActionType } }>>().params
  const { txId, actionType } = routeParams
  const { setTxSigner } = useTxSignerActions()
  const activeSafe = useDefinedActiveSafe()
  const { data: txDetails, isLoading: isLoadingTxDetails } = useTransactionData(txId)
  const manualParams = useAppSelector(selectEstimatedFee)

  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const activeSigner = useAppSelector((state: RootState) => selectActiveSigner(state, activeSafe.address))

  const { items, loading } = useAvailableSigners(txId, actionType)
  const { estimatedFeeParams } = useGasFee(txDetails as TransactionDetails, manualParams)
  const totalFee = getTotalFee(estimatedFeeParams.maxFeePerGas ?? 0n, estimatedFeeParams.gasLimit ?? 0n)

  const onSignerPress = (signer: SignerInfo, onClose: () => void) => () => {
    if (activeSigner?.value !== signer.value) {
      setTxSigner(signer)
    }

    onClose()
  }

  return (
    <SafeBottomSheet
      title="Select signer"
      items={items}
      loading={loading || isLoadingTxDetails}
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
            balance={`${item.balance ? formatVisualAmount(item.balance, activeChain.nativeCurrency.decimals) : '0'} ${
              activeChain.nativeCurrency.symbol
            }`}
            rightNode={getActiveSignerRightNode(totalFee, item, activeSigner)}
          />
        </View>
      )}
    />
  )
}
