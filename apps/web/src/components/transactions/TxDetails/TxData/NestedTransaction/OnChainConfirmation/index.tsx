import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useChainId from '@/hooks/useChainId'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NestedTransaction } from '../NestedTransaction'
import TxData from '../..'
import { useSignedHash } from '../useSignedHash'
import { OnChainConfirmationView } from '@views/components/transactions/TxDetails/TxData/NestedTransaction/OnChainConfirmation/OnChainConfirmationView'

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
      <OnChainConfirmationView
        nestedTxData={
          nestedTxDetails && (
            <TxData
              txData={nestedTxDetails.txData}
              txInfo={nestedTxDetails.txInfo}
              txDetails={nestedTxDetails}
              trusted
              imitation={false}
            />
          )
        }
        hasError={!!txDetailsError}
        renderErrorMessage={(children) => <ErrorMessage>{children}</ErrorMessage>}
      />
    </NestedTransaction>
  )
}
