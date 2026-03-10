import type { ReactElement } from 'react'
import { useMemo } from 'react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { getSafeTxHashFromDetails } from '../../services/safeTxHashCalculation'
import HnSecurityReportBtn from './HnSecurityReportBtn'

export interface HnSecurityReportBtnWithTxHashProps {
  txDetails: TransactionDetails
}

/**
 * Hook that extracts the safeTxHash from transaction details.
 * The safeTxHash is the hash of the transaction struct without signatures.
 *
 * @param txDetails - Transaction details from the gateway API
 * @returns The safeTxHash or null if it's not available
 */
export const useSafeTxHash = (txDetails: TransactionDetails): string | null => {
  return useMemo(() => {
    return getSafeTxHashFromDetails(txDetails)
  }, [txDetails])
}

/**
 * Wrapper component that extracts the safeTxHash from transaction details
 * and passes it to HnSecurityReportBtn. The hash is the hash of the transaction
 * struct without signatures, which is the correct hash for security reports.
 */
export const HnSecurityReportBtnWithTxHash = ({
  txDetails,
}: HnSecurityReportBtnWithTxHashProps): ReactElement | null => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const safeTxHash = useSafeTxHash(txDetails)

  // Don't render if we couldn't calculate the hash or if chain info is missing
  if (!safeTxHash || !chainId) {
    return null
  }

  return <HnSecurityReportBtn chainId={chainId} safe={safeAddress} tx={safeTxHash} />
}
