import useIsExpiredSwap from '@/features/swap/hooks/useIsExpiredSwap'
import React, { type ReactElement, useEffect } from 'react'
import type { TransactionDetails, TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, CircularProgress, Typography } from '@mui/material'

import TxSigners from '@/components/transactions/TxSigners'
import Summary from '@/components/transactions/TxDetails/Summary'
import TxData from '@/components/transactions/TxDetails/TxData'
import useChainId from '@/hooks/useChainId'
import {
  isAwaitingExecution,
  isOrderTxInfo,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isMultisigDetailedExecutionInfo,
  isMultisigExecutionInfo,
  isOpenSwapOrder,
  isTxQueued,
} from '@/utils/transaction-guards'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import css from './styles.module.css'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { TxShareButton } from '../TxShareLink/TxShareButton'
import { ErrorBoundary } from '@sentry/react'
import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'
import SignTxButton from '@/components/transactions/SignTxButton'
import RejectTxButton from '@/components/transactions/RejectTxButton'
import { UnsignedWarning } from '@/components/transactions/Warning'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsPending from '@/hooks/useIsPending'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import { asError } from '@/services/exceptions/utils'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxNote } from '@/features/tx-notes'
import { TxShareBlock } from '../TxShareLink/TxShareBlock'

export const NOT_AVAILABLE = 'n/a'

type TxDetailsProps = {
  txSummary: TransactionSummary
  txDetails: TransactionDetails
}

const TxDetailsBlock = ({ txSummary, txDetails }: TxDetailsProps): ReactElement => {
  const isPending = useIsPending(txSummary.id)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const isQueue = isTxQueued(txSummary.txStatus)
  const awaitingExecution = isAwaitingExecution(txSummary.txStatus)
  const isUnsigned =
    isMultisigExecutionInfo(txSummary.executionInfo) && txSummary.executionInfo.confirmationsSubmitted === 0

  const isTxFromProposer =
    isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo) &&
    txDetails.detailedExecutionInfo.trusted &&
    isUnsigned

  const isUntrusted =
    isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo) && !txDetails.detailedExecutionInfo.trusted

  // If we have no token list we always trust the transfer
  const isTrustedTransfer = !hasDefaultTokenlist || isTrustedTx(txSummary)
  const isImitationTransaction = isImitation(txSummary)

  let proposer, safeTxHash, proposedByDelegate
  if (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    safeTxHash = txDetails.detailedExecutionInfo.safeTxHash
    // @ts-expect-error TODO: Need to update the types from the new SDK
    proposedByDelegate = txDetails.detailedExecutionInfo.proposedByDelegate
    proposer = proposedByDelegate?.value ?? txDetails.detailedExecutionInfo.proposer?.value
  }

  const expiredSwap = useIsExpiredSwap(txSummary.txInfo)

  // Module address, name and logoUri
  const moduleAddress = isModuleExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.address : undefined
  const moduleAddressInfo = moduleAddress ? txDetails.txData?.addressInfoIndex?.[moduleAddress.value] : undefined

  return (
    <>
      {/* /Details */}
      <div className={`${css.details} ${isUnsigned ? css.noSigners : ''}`}>
        <div className={css.txNote}>
          <TxNote txDetails={txDetails} />
        </div>

        <div className={css.shareLink}>
          <TxShareButton txId={txSummary.id} />
        </div>

        <div className={css.txData}>
          <ErrorBoundary fallback={<div>Error parsing data</div>}>
            <TxData
              txData={txDetails.txData}
              txInfo={txDetails.txInfo}
              txDetails={txDetails}
              trusted={isTrustedTransfer}
              imitation={isImitationTransaction}
            />
          </ErrorBoundary>
        </div>

        {/* Module information*/}
        {moduleAddress && (
          <div className={css.txModule}>
            <InfoDetails title="Executed via module:">
              <NamedAddressInfo
                address={moduleAddress.value}
                name={moduleAddressInfo?.name || moduleAddress.name}
                customAvatar={moduleAddressInfo?.logoUri || moduleAddress.logoUri}
                shortAddress={false}
                showCopyButton
                hasExplorer
              />
            </InfoDetails>
          </div>
        )}

        <div className={css.txSummary}>
          {isUntrusted && !isPending && <UnsignedWarning />}
          <Summary txDetails={txDetails} />
        </div>

        {(isMultiSendTxInfo(txDetails.txInfo) || isOrderTxInfo(txDetails.txInfo)) && (
          <div className={css.multiSend}>
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              <Multisend txData={txDetails.txData} />
            </ErrorBoundary>
          </div>
        )}
      </div>
      {/* Signers */}
      {(!isUnsigned || isTxFromProposer) && (
        <div className={css.txSigners}>
          <TxSigners
            txDetails={txDetails}
            txSummary={txSummary}
            isTxFromProposer={isTxFromProposer}
            proposer={proposedByDelegate}
          />

          {isQueue && <TxShareBlock txId={txDetails.txId} />}

          {isQueue && (
            <Box className={css.buttons}>
              {awaitingExecution ? <ExecuteTxButton txSummary={txSummary} /> : <SignTxButton txSummary={txSummary} />}
              <RejectTxButton txSummary={txSummary} safeTxHash={safeTxHash} proposer={proposer} />
            </Box>
          )}

          {isQueue && expiredSwap && (
            <Typography color="text.secondary" mt={2}>
              This order has expired. Reject this transaction and try again.
            </Typography>
          )}
        </div>
      )}
    </>
  )
}

const TxDetails = ({
  txSummary,
  txDetails,
}: {
  txSummary: TransactionSummary
  txDetails?: TransactionDetails // optional
}): ReactElement => {
  const chainId = useChainId()
  const { safe } = useSafeInfo()

  const {
    data: txDetailsData,
    error,
    isLoading: loading,
    refetch,
    isUninitialized,
  } = useGetTransactionDetailsQuery(
    { chainId, txId: txSummary.id },
    {
      pollingInterval: isOpenSwapOrder(txSummary.txInfo) ? POLLING_INTERVAL : undefined,
    },
  )

  useEffect(() => {
    !isUninitialized && refetch()
  }, [safe.txQueuedTag, refetch, txDetails, isUninitialized])

  return (
    <div className={css.container}>
      {txDetailsData ? (
        <TxDetailsBlock txSummary={txSummary} txDetails={txDetailsData} />
      ) : loading ? (
        <div className={css.loading}>
          <CircularProgress />
        </div>
      ) : (
        error && (
          <div className={css.error}>
            <ErrorMessage error={asError(error)}>Couldn&apos;t load the transaction details</ErrorMessage>
          </div>
        )
      )}
    </div>
  )
}

export default TxDetails
