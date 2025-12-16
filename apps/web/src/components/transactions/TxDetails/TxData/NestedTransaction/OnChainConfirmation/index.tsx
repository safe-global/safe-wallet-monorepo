import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useChainId from '@/hooks/useChainId'
import { Skeleton } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NestedTransaction } from '../NestedTransaction'
import TxData from '../..'
import { useSignedHash } from '../useSignedHash'

export const OnChainConfirmation = ({
  data,
  isConfirmationView = false,
}: {
  data?: TransactionData | null
  isConfirmationView?: boolean
}) => {
  const chainId = useChainId()
  const signedHash = useSignedHash(data)

  const { data: nestedTxDetails, error: txDetailsError } = useTransactionsGetTransactionByIdV1Query(
    { chainId: chainId || '', id: signedHash || '' },
    { skip: !signedHash || !chainId },
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
