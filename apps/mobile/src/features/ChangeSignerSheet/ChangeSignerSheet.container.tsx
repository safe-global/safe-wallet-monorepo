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
import { formatValue } from '@/src/utils/formatters'
import { ContactDisplayNameContainer } from '../AddressBook'
import { useTxSignerActions } from '../ConfirmTx/hooks/useTxSignerActions'
import useAvailableSigners from '@/src/features/ChangeSignerSheet/useAvailableSigners'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ActionType } from '@/src/features/ChangeSignerSheet/utils'

export const ChangeSignerSheetContainer = () => {
  const routeParams = useRoute<RouteProp<{ params: { txId: string; actionType: ActionType } }>>().params
  const { txId, actionType } = routeParams
  const { setTxSigner } = useTxSignerActions()
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const activeSigner = useAppSelector((state: RootState) => selectActiveSigner(state, activeSafe.address))

  const { items, loading } = useAvailableSigners(txId, actionType)

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
      loading={loading}
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
