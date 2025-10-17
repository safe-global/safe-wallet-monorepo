import useChainId from '@/hooks/useChainId'
import { Skeleton } from '@mui/material'
import { type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import { skipToken } from '@reduxjs/toolkit/query'
import { NestedTransaction } from '../NestedTransaction'
import TxData from '../..'
import { useSignedHash } from '../useSignedHash'

export const OnChainConfirmation = ({
  data,
  isConfirmationView = false,
}: {
  data?: TransactionData
  isConfirmationView?: boolean
}) => {
  const chainId = useChainId()
  const signedHash = useSignedHash(data)

  const { data: nestedTxDetails, error: txDetailsError } = useGetTransactionDetailsQuery(
    signedHash
      ? {
          chainId,
          txId: signedHash,
        }
      : skipToken,
  )

  return (
    <NestedTransaction txData={data} isConfirmationView={isConfirmationView}>
      {nestedTxDetails ? (
        <TxData
          txData={nestedTxDetails.txData}
          txInfo={nestedTxDetails.txInfo}
          txDetails={nestedTxDetails}
          trusted
          imitation={false}
        />
      ) : txDetailsError ? (
        <ErrorMessage>Could not load details on hash to approve.</ErrorMessage>
      ) : (
        <Skeleton />
      )}
    </NestedTransaction>
  )
}
