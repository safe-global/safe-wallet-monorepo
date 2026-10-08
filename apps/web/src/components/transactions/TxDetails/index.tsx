import type { TransactionDetails, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useIsExpiredSwap } from '@/features/swap'
import React, { type ReactElement, useEffect, useRef, useState, useMemo } from 'react'

import TxSigners from '@/components/transactions/TxSigners'
import Summary from '@/components/transactions/TxDetails/Summary'
import TxData from '@/components/transactions/TxDetails/TxData'
import useChainId from '@/hooks/useChainId'
import useProposers from '@/hooks/useProposers'
import {
  isAwaitingExecution,
  isOrderTxInfo,
  isModuleDetailedExecutionInfo,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isMultisigDetailedExecutionInfo,
  isMultisigExecutionInfo,
  isOpenSwapOrder,
  isTxQueued,
  isCustomTxInfo,
  isBridgeOrderTxInfo,
  isLifiSwapTxInfo,
} from '@/utils/transaction-guards'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'
import SignTxButton from '@/components/transactions/SignTxButton'
import RejectTxButton from '@/components/transactions/RejectTxButton'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsPending from '@/hooks/useIsPending'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import { useHasFeature } from '@/hooks/useChains'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxNotesFeature } from '@/features/tx-notes'
import { useLoadFeature } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import DecodedData from './TxData/DecodedData'
import { QueuedTxSimulation } from '../QueuedTxSimulation'
import { HypernativeFeature } from '@/features/hypernative'
import { TxDetailsBlockView, TxDetailsView } from '@views/components/transactions/TxDetails/TxDetailsView'
import { ParsingErrorView } from '@views/components/transactions/TxDetails/TxData/TxDataView'

export const NOT_AVAILABLE = 'n/a'

type TxDetailsProps = {
  txSummary: Transaction
  txDetails: TransactionDetails
}

const TxDetailsBlock = ({ txSummary, txDetails }: TxDetailsProps): ReactElement => {
  const txNotes = useLoadFeature(TxNotesFeature)
  const hn = useLoadFeature(HypernativeFeature)
  const isPending = useIsPending(txSummary.id)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const isQueue = isTxQueued(txSummary.txStatus)
  const awaitingExecution = isAwaitingExecution(txSummary.txStatus)
  const { data: proposersData } = useProposers()

  // Used to check if the decoded data was rendered inside the TxData component
  // If it was, we hide the decoded data in the Summary to avoid showing it twice
  const decodedDataRef = useRef<HTMLDivElement>(null)
  const [isDecodedDataVisible, setIsDecodedDataVisible] = useState(false)

  useEffect(() => {
    // If decodedDataRef.current is not null, the decoded data was rendered inside the TxData component
    setIsDecodedDataVisible(!!decodedDataRef.current)
  }, [])

  const isUnsigned =
    isMultisigExecutionInfo(txSummary.executionInfo) && txSummary.executionInfo.confirmationsSubmitted === 0

  const isUntrusted =
    isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo) && !txDetails.detailedExecutionInfo.trusted

  // If we have no token list we always trust the transfer
  const isTrustedTransfer = !hasDefaultTokenlist || isTrustedTx(txSummary)
  const isImitationTransaction = isImitation(txSummary)

  let proposer: string | undefined
  let safeTxHash: string | undefined
  let proposedByDelegate
  if (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    safeTxHash = txDetails.detailedExecutionInfo.safeTxHash
    proposedByDelegate = txDetails.detailedExecutionInfo.proposedByDelegate
    proposer = proposedByDelegate?.value ?? txDetails.detailedExecutionInfo.proposer?.value
  }

  // Check if the proposer is actually a delegate
  const isProposerDelegate = useMemo(() => {
    if (!proposer || !proposersData?.results) return false
    return proposersData.results.some((p) => sameAddress(p.delegate, proposer))
  }, [proposer, proposersData])

  const isTxFromProposer = Boolean(proposedByDelegate) || isProposerDelegate

  const expiredSwap = useIsExpiredSwap(txSummary.txInfo)

  // Module address, name and logoUri
  const moduleAddress = isModuleExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.address : undefined
  const moduleAddressInfo = moduleAddress ? txDetails.txData?.addressInfoIndex?.[moduleAddress.value] : undefined

  const { safe } = useSafeInfo()

  const isModuleExecution = isModuleDetailedExecutionInfo(txDetails.detailedExecutionInfo)
  const showAuditLog =
    (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo) && (!isUnsigned || !!proposer)) ||
    isModuleExecution ||
    !!txDetails.executedAt

  return (
    <TxDetailsBlockView
      isUnsigned={isUnsigned}
      txNote={<txNotes.TxNote txDetails={txDetails} />}
      simulation={isQueue && <QueuedTxSimulation transaction={txDetails} />}
      renderTxData={(children) => (
        <ObservabilityErrorBoundary fallback={<ParsingErrorView />}>
          <TxData
            txData={txDetails.txData}
            txInfo={txDetails.txInfo}
            txDetails={txDetails}
            trusted={isTrustedTransfer}
            imitation={isImitationTransaction}
          >
            {children}
          </TxData>
        </ObservabilityErrorBoundary>
      )}
      decodedDataRef={decodedDataRef}
      decodedData={
        <DecodedData
          txData={txDetails.txData}
          toInfo={isCustomTxInfo(txDetails.txInfo) ? txDetails.txInfo.to : txDetails.txData?.to}
          isWarningEnabled
        />
      }
      moduleAddressInfo={
        moduleAddress &&
        !showAuditLog && (
          <NamedAddressInfo
            address={moduleAddress.value}
            name={moduleAddressInfo?.name || moduleAddress.name}
            customAvatar={moduleAddressInfo?.logoUri || moduleAddress.logoUri}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        )
      }
      showUnsignedWarning={isUntrusted && !isPending}
      summary={
        <ObservabilityErrorBoundary fallback={<ParsingErrorView />}>
          <Summary
            txDetails={txDetails}
            txData={txDetails.txData}
            txInfo={txDetails.txInfo}
            showMultisend={false}
            showDecodedData={!isDecodedDataVisible}
            showAuditLogFields={!showAuditLog}
          />
        </ObservabilityErrorBoundary>
      }
      multisend={
        (isMultiSendTxInfo(txDetails.txInfo) ||
          isOrderTxInfo(txDetails.txInfo) ||
          isBridgeOrderTxInfo(txDetails.txInfo) ||
          isLifiSwapTxInfo(txDetails.txInfo)) && (
          <ObservabilityErrorBoundary fallback={<ParsingErrorView />}>
            <Multisend txData={txDetails.txData} isExecuted={!!txDetails.executedAt} />
          </ObservabilityErrorBoundary>
        )
      }
      showSigners={!isUnsigned || !!proposer}
      txSigners={
        <TxSigners
          txDetails={txDetails}
          txSummary={txSummary}
          isTxFromProposer={isTxFromProposer}
          proposer={proposer}
          isExpired={expiredSwap}
        />
      }
      securitySection={
        isQueue && <hn.HnSecuritySection txDetails={txDetails} safeTxHash={safeTxHash} chainId={safe.chainId} />
      }
      buttons={
        isQueue &&
        (isTxFromProposer ? (
          <>
            {!expiredSwap &&
              (awaitingExecution ? <ExecuteTxButton txSummary={txSummary} /> : <SignTxButton txSummary={txSummary} />)}
            <RejectTxButton txSummary={txSummary} safeTxHash={safeTxHash} proposer={proposer} />
          </>
        ) : (
          <>
            {awaitingExecution ? <ExecuteTxButton txSummary={txSummary} /> : <SignTxButton txSummary={txSummary} />}
            <RejectTxButton txSummary={txSummary} safeTxHash={safeTxHash} proposer={proposer} />
          </>
        ))
      }
    />
  )
}

const TxDetails = ({
  txSummary,
  txDetails,
  contrastSurface = false,
}: {
  txSummary: Transaction
  txDetails?: TransactionDetails // optional
  contrastSurface?: boolean
}): ReactElement => {
  const chainId = useChainId()
  const { safe } = useSafeInfo()

  const {
    data: txDetailsData,
    error,
    isLoading: loading,
    refetch,
    isUninitialized,
  } = useTransactionsGetTransactionByIdV1Query(
    { chainId: chainId || '', id: txSummary.id || '' },
    {
      pollingInterval: isOpenSwapOrder(txSummary.txInfo) ? POLLING_INTERVAL : undefined,
      skipPollingIfUnfocused: true,
    },
  )

  useEffect(() => {
    !isUninitialized && refetch()
  }, [safe.txQueuedTag, refetch, txDetails, isUninitialized])

  return (
    <TxDetailsView
      contrastSurface={contrastSurface}
      block={txDetailsData && <TxDetailsBlock txSummary={txSummary} txDetails={txDetailsData} />}
      loading={loading}
      hasError={!!error}
      renderErrorMessage={(children) => <ErrorMessage error={asError(error)}>{children}</ErrorMessage>}
    />
  )
}

export default TxDetails
