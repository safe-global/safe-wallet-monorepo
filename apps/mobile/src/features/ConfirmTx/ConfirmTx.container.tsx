import React from 'react'
import { ScrollView, View } from 'tamagui'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { TransactionInfo } from './components/TransactionInfo'
import {
  MultisigExecutionDetails,
  useTransactionsGetTransactionByIdV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ConfirmationView } from './components/ConfirmationView'
import { LoadingTx } from './components/LoadingTx'
import { useTxSigner } from './hooks/useTxSigner'
import { Alert } from '@/src/components/Alert'
import { ConfirmTxForm } from './components/ConfirmTxForm'

function ConfirmTxContainer() {
  const activeSafe = useDefinedActiveSafe()
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>Confirm transaction</NavBarTitle>,
    alwaysVisible: true,
  })

  const { data, isFetching, isError } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  const detailedExecutionInfo = data?.detailedExecutionInfo as MultisigExecutionDetails
  const { activeSigner, hasSigned } = useTxSigner(detailedExecutionInfo)
  const hasEnoughConfirmations =
    detailedExecutionInfo?.confirmationsRequired <= detailedExecutionInfo?.confirmations?.length

  if (isFetching || !data) {
    return <LoadingTx />
  }

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction details" />
      </View>
    )
  }

  const isExpired = 'status' in data.txInfo && data.txInfo.status === 'expired'

  return (
    <View flex={1}>
      <ScrollView onScroll={handleScroll}>
        <View paddingHorizontal="$4">
          <ConfirmationView txDetails={data} />
        </View>
        <TransactionInfo txId={txId} detailedExecutionInfo={detailedExecutionInfo} />
      </ScrollView>

      <View paddingTop="$1" backgroundColor="$background">
        <ConfirmTxForm
          hasSigned={Boolean(hasSigned)}
          hasEnoughConfirmations={hasEnoughConfirmations}
          activeSigner={activeSigner}
          isExpired={isExpired}
          txId={txId}
        />
      </View>
    </View>
  )
}

export default ConfirmTxContainer
