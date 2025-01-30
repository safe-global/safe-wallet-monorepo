import React, { type ReactElement } from 'react'
import type { TransactionDetails, TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'

import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, CircularProgress } from '@mui/material'

import TxSigners from '@/components/transactions/TxSigners'
import Summary from '@/components/transactions/TxDetails/Summary'
import TxData from '@/components/transactions/TxDetails/TxData'
import {
  isAwaitingExecution,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isMultisigDetailedExecutionInfo,
  isMultisigExecutionInfo,
  isTxQueued,
} from '@/utils/transaction-guards'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import EthHashInfo from '@/components/common/EthHashInfo'
import css from './styles.module.css'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxShareLink from '../TxShareLink'
import { ErrorBoundary } from '@sentry/react'
import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'
import SignTxButton from '@/components/transactions/SignTxButton'
import RejectTxButton from '@/components/transactions/RejectTxButton'
import { DelegateCallWarning, UnsignedWarning } from '@/components/transactions/Warning'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import useIsPending from '@/hooks/useIsPending'
import { isTrustedTx } from '@/utils/transactions'
import type { TimelockTx } from '@/hooks/hsgsuper/hsgsuper'
import { shouldSchedule as shouldScheduleHelper } from '@/hooks/hsgsuper/hsgsuper'
import { TimelockStatus } from '@/hooks/hsgsuper/hsgsuper'

export const NOT_AVAILABLE = 'n/a'

type TxDetailsProps = {
  txSummary: TransactionSummary
  txDetails: TransactionDetails
  timelockTx?: TimelockTx
}

const TxDetailsBlock = ({ txSummary, txDetails, timelockTx }: TxDetailsProps): ReactElement => {
  const isPending = useIsPending(txSummary.id)
  const isQueue = isTxQueued(txSummary.txStatus)
  const awaitingExecution = isAwaitingExecution(txSummary.txStatus)
  const isScheduled = !!timelockTx && timelockTx.status === TimelockStatus.SCHEDULED
  const shouldSchedule = !!timelockTx && shouldScheduleHelper(timelockTx)
  const isUnsigned =
    isMultisigExecutionInfo(txSummary.executionInfo) && txSummary.executionInfo.confirmationsSubmitted === 0

  const isUntrusted =
    isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo) &&
    txDetails.detailedExecutionInfo.trusted === false

  const isTrustedTransfer = isTrustedTx(txSummary)

  return (
    <>
      {/* /Details */}
      <div className={`${css.details} ${isUnsigned ? css.noSigners : ''}`}>
        <div className={css.shareLink}>
          <TxShareLink id={txSummary.id} />
        </div>

        <div className={css.txData}>
          <ErrorBoundary fallback={<div>Error parsing data</div>}>
            <TxData txDetails={txDetails} trusted={isTrustedTransfer} />
          </ErrorBoundary>
        </div>

        {/* Module information*/}
        {isModuleExecutionInfo(txSummary.executionInfo) && (
          <div className={css.txModule}>
            <InfoDetails title="Module:">
              <EthHashInfo
                address={txSummary.executionInfo.address.value}
                shortAddress={false}
                showCopyButton
                hasExplorer
              />
            </InfoDetails>
          </div>
        )}

        <div className={css.txSummary}>
          {isUntrusted && !isPending && <UnsignedWarning />}

          {txDetails.txData?.operation === Operation.DELEGATE && (
            <div className={css.delegateCall}>
              <DelegateCallWarning showWarning={!txDetails.txData.trustedDelegateCallTarget} />
            </div>
          )}
          <Summary txDetails={txDetails} />
        </div>

        {isMultiSendTxInfo(txDetails.txInfo) && (
          <div className={`${css.multiSend}`}>
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              <Multisend txData={txDetails.txData} />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Signers */}
      {!isUnsigned && (
        <div className={css.txSigners}>
          <TxSigners txDetails={txDetails} txSummary={txSummary} timelockTx={timelockTx} />

          {isQueue && !isScheduled && (
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
              {awaitingExecution ? (
                <ExecuteTxButton txSummary={txSummary} shouldSchedule={shouldSchedule} />
              ) : (
                <SignTxButton txSummary={txSummary} />
              )}
              <RejectTxButton txSummary={txSummary} />
            </Box>
          )}
        </div>
      )}
    </>
  )
}

const TxDetails = ({
  txSummary,
  txDetailsData,
  timelockTx,
  loading,
  error,
}: {
  txSummary: TransactionSummary
  timelockTx?: TimelockTx
  txDetailsData?: TransactionDetails // optional
  loading: boolean
  error?: Error
}): ReactElement => {
  // console.log('Details: ', txDetailsData)
  // if (
  //   txDetailsData &&
  //   txDetailsData.txInfo.type === TransactionInfoType.TRANSFER &&
  //   txDetailsData.txInfo.transferInfo.type === TransactionTokenType.NATIVE_COIN &&
  //   txDetailsData.detailedExecutionInfo?.type === DetailedExecutionInfoType.MULTISIG &&
  //   txDetailsData.txData?.value
  // ) {
  //   const proposalId = getProposalId(
  //     txDetailsData.safeAddress,
  //     txDetailsData.txData.to.value,
  //     txDetailsData.txData.value,
  //     txDetailsData.txData.operation,
  //     txDetailsData.detailedExecutionInfo.safeTxGas,
  //     txDetailsData.detailedExecutionInfo.baseGas,
  //     txDetailsData.detailedExecutionInfo.gasPrice,
  //     txDetailsData.detailedExecutionInfo.gasToken,
  //     txDetailsData.detailedExecutionInfo.refundReceiver.value,
  //     txDetailsData.detailedExecutionInfo.confirmations,
  //   )

  //   if (provider) {
  //     const filter = {
  //       fromBlock: -70000,
  //       toBlock: 'latest',
  //       topics: [ethers.utils.id('CallScheduled(bytes32,uint256,address,uint256,bytes,bytes32,uint256)'), proposalId],
  //     }
  //     provider.getLogs(filter).then((logs) => {
  //       console.log('Logs: ', logs)
  //     })

  //     // const timelock
  //   } else {
  //     console.log('No provider')
  //   }
  // }

  return (
    <div className={css.container}>
      {txDetailsData ? (
        <TxDetailsBlock txSummary={txSummary} txDetails={txDetailsData} timelockTx={timelockTx} />
      ) : loading ? (
        <div className={css.loading}>
          <CircularProgress />
        </div>
      ) : (
        error && (
          <div className={css.error}>
            <ErrorMessage error={error}>Couldn&apos;t load the transaction details</ErrorMessage>
          </div>
        )
      )}
    </div>
  )
}

export default TxDetails
