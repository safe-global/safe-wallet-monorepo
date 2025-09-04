import React from 'react'
import { ScrollView, View } from 'tamagui'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { TransactionInfo } from './components/TransactionInfo'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ConfirmationView } from './components/ConfirmationView'
import { LoadingTx } from './components/LoadingTx'
import { Alert } from '@/src/components/Alert'
import { ConfirmTxForm } from './components/ConfirmTxForm'
import { useTransactionSigner } from './hooks/useTransactionSigner'
import { useTxSignerAutoSelection } from './hooks/useTxSignerAutoSelection'

function ConfirmTxContainer() {
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId

  const { txDetails, detailedExecutionInfo, isLoading, isError } = useTransactionSigner(txId)

  useTxSignerAutoSelection(detailedExecutionInfo)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>Confirm transaction</NavBarTitle>,
    alwaysVisible: true,
  })

  const hasEnoughConfirmations =
    detailedExecutionInfo?.confirmationsRequired <= detailedExecutionInfo?.confirmations?.length

  if (isLoading || !txDetails) {
    return <LoadingTx />
  }

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction details" />
      </View>
    )
  }

  const isExpired = 'status' in txDetails.txInfo && txDetails.txInfo.status === 'expired'

  return (
    <View flex={1}>
      <ScrollView onScroll={handleScroll}>
        <View paddingHorizontal="$4">
          <ConfirmationView txDetails={txDetails} />
        </View>
        <TransactionInfo txId={txId} detailedExecutionInfo={detailedExecutionInfo} txDetails={txDetails} />
      </ScrollView>

      <View paddingTop="$1">
        <ConfirmTxForm hasEnoughConfirmations={hasEnoughConfirmations} isExpired={isExpired} txId={txId} />
      </View>
    </View>
  )
}

export default ConfirmTxContainer
