import useChainId from '@/hooks/useChainId'
import { Skeleton, Stack } from '@mui/material'
import { type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { NestedTransaction } from '../NestedTransaction'
import TxData from '../..'
import { isMultiSendTxInfo, isOrderTxInfo } from '@/utils/transaction-guards'
import { ErrorBoundary } from '@sentry/react'
import Multisend from '../../DecodedData/Multisend'
import { TxSimulation, TxSimulationMessage } from '@/components/tx/security/tenderly'
import type { SafeTransaction } from '@safe-global/types-kit'
import extractTxInfo from '@/services/tx/extractTxInfo'
import { useSignedHash } from '../useSignedHash'
import useSafeAddress from '@/hooks/useSafeAddress'

export const OnChainConfirmation = ({
  data,
  isConfirmationView = false,
}: {
  data?: TransactionData
  isConfirmationView?: boolean
}) => {
  const chainId = useChainId()
  const signedHash = useSignedHash(data)
  const safeAddress = useSafeAddress()

  const { data: nestedTxDetails, error: txDetailsError } = useGetTransactionDetailsQuery(
    signedHash
      ? {
          chainId,
          txId: signedHash,
        }
      : skipToken,
  )

  const nestedTx = useMemo<SafeTransaction | undefined>(
    () =>
      nestedTxDetails
        ? {
            addSignature: () => {},
            encodedSignatures: () => '',
            getSignature: () => undefined,
            data: extractTxInfo(nestedTxDetails).txParams,
            signatures: new Map(),
          }
        : undefined,
    [nestedTxDetails],
  )

  return (
    <NestedTransaction txData={data} isConfirmationView={isConfirmationView}>
      {nestedTxDetails ? (
        <>
          <TxData
            txData={nestedTxDetails.txData}
            txInfo={nestedTxDetails.txInfo}
            txDetails={nestedTxDetails}
            trusted
            imitation={false}
          />

          {(isMultiSendTxInfo(nestedTxDetails.txInfo) || isOrderTxInfo(nestedTxDetails.txInfo)) && (
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              <Multisend txData={nestedTxDetails.txData} isExecuted={!!nestedTxDetails.executedAt} />
            </ErrorBoundary>
          )}

          {isConfirmationView && (
            <Stack spacing={2}>
              <TxSimulation
                disabled={false}
                transactions={nestedTx}
                title="Simulate nested transaction"
                executionOwner={safeAddress}
                nestedSafe={nestedTxDetails.safeAddress}
              />
              <TxSimulationMessage isNested />
            </Stack>
          )}
        </>
      ) : txDetailsError ? (
        <ErrorMessage>Could not load details on hash to approve.</ErrorMessage>
      ) : (
        <Skeleton />
      )}
    </NestedTransaction>
  )
}
