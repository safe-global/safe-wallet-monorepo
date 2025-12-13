import React, { useCallback, useState } from 'react'
import { ScrollView, View } from 'tamagui'
import { RefreshControl } from 'react-native'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { TransactionInfo } from './components/TransactionInfo'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ConfirmationView } from './components/ConfirmationView'
import { Loader } from '@/src/components/Loader'
import { Alert } from '@/src/components/Alert'
import { ConfirmTxForm } from './components/ConfirmTxForm'
import { useTransactionSigner } from './hooks/useTransactionSigner'
import { useTxSignerAutoSelection } from './hooks/useTxSignerAutoSelection'
import { useAppSelector } from '@/src/store/hooks'
import { PendingStatus, selectPendingTxById } from '@/src/store/pendingTxsSlice'
import { useTransactionProcessingState } from '@/src/hooks/useTransactionProcessingState'
import { useFocusEffect, useRouter } from 'expo-router'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

const getHeaderText = (isExecuting: boolean, isSigning: boolean): string => {
  if (isExecuting) {
    return 'Executing...'
  }
  if (isSigning) {
    return 'Signing...'
  }
  return 'Confirm transaction'
}

function ConfirmTxContainer() {
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId
  const router = useRouter()
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, txId))
  const { isProcessing, isExecuting, isSigning } = useTransactionProcessingState(txId)
  const [highlightedSeverity, setHighlightedSeverity] = useState<Severity | undefined>(undefined)
  const [riskAcknowledged, setRiskAcknowledged] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { txDetails, detailedExecutionInfo, isLoading, isError, refetch } = useTransactionSigner(txId)
  const [refetchKey, setRefetchKey] = useState(0)
  useTxSignerAutoSelection(detailedExecutionInfo)

  const isFinalizedTx = txDetails?.txStatus === 'SUCCESS' || txDetails?.txStatus === 'FAILED'

  const handleHistoryNavigation = useCallback(() => {
    if (pendingTx?.status === PendingStatus.SUCCESS || isFinalizedTx) {
      router.dismissAll()
      router.push({
        pathname: '/history-transaction-details',
        params: {
          txId,
        },
      })
    }
  }, [pendingTx?.status, isFinalizedTx])

  useFocusEffect(handleHistoryNavigation)
  const headerText = getHeaderText(isExecuting, isSigning)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{headerText}</NavBarTitle>,
    alwaysVisible: true,
  })

  const hasEnoughConfirmations =
    detailedExecutionInfo?.confirmationsRequired <= detailedExecutionInfo?.confirmations?.length

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      setRefetchKey((prev) => prev + 1)
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const isExpired = !!(txDetails && 'status' in txDetails.txInfo && txDetails.txInfo.status === 'expired')

  return (
    <View flex={1}>
      <ScrollView
        onScroll={handleScroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={isLoading || isError ? { flex: 1 } : undefined}
      >
        {isLoading ? (
          <View flex={1} justifyContent="center" alignItems="center">
            <Loader size={64} color="#12FF80" />
          </View>
        ) : isError && !txDetails ? (
          <View justifyContent="center" padding="$4">
            <Alert type="error" message="Error fetching transaction details" />
          </View>
        ) : (
          txDetails && (
            <>
              <View paddingHorizontal="$4">
                <ConfirmationView txDetails={txDetails} />
              </View>

              <TransactionInfo
                txId={txId}
                detailedExecutionInfo={detailedExecutionInfo}
                txDetails={txDetails}
                pendingTx={pendingTx}
                onSeverityChange={setHighlightedSeverity}
                key={refetchKey.toString()}
              />
            </>
          )
        )}
      </ScrollView>

      {!isLoading && txDetails && (
        <View paddingTop="$1">
          <ConfirmTxForm
            hasEnoughConfirmations={hasEnoughConfirmations}
            isExpired={isExpired}
            isPending={isProcessing}
            txId={txId}
            highlightedSeverity={highlightedSeverity}
            riskAcknowledged={riskAcknowledged}
            onRiskAcknowledgedChange={setRiskAcknowledged}
          />
        </View>
      )}
    </View>
  )
}

export default ConfirmTxContainer
