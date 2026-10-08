import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement } from 'react'
import MethodCall from '../DecodedData/MethodCall'
import { MethodDetails } from '../DecodedData/MethodDetails'
import { AppRoutes } from '@/config/routes'
import { useSignedHash } from './useSignedHash'
import { useCurrentChain } from '@/hooks/useChains'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import { NestedTransactionView } from '@views/components/transactions/TxDetails/TxData/NestedTransaction/NestedTransactionView'

export const NestedTransaction = ({
  txData,
  children,
  isConfirmationView = false,
}: {
  txData: TransactionData | null | undefined
  children: ReactElement
  isConfirmationView?: boolean
}) => {
  const chain = useCurrentChain()
  const spaceId = useUrlSpaceId()
  const signedHash = useSignedHash(txData)
  return (
    <NestedTransactionView
      decoded={
        !isConfirmationView && txData?.dataDecoded
          ? {
              methodCall: <MethodCall contractAddress={txData.to.value} method={txData.dataDecoded.method} />,
              methodDetails: <MethodDetails data={txData.dataDecoded} addressInfoIndex={txData.addressInfoIndex} />,
            }
          : undefined
      }
      openHref={
        chain && txData && signedHash
          ? {
              pathname: AppRoutes.transactions.tx,
              query: withSpaceId({ safe: `${chain?.shortName}:${txData.to.value}`, id: signedHash }, spaceId),
            }
          : undefined
      }
    >
      {children}
    </NestedTransactionView>
  )
}
