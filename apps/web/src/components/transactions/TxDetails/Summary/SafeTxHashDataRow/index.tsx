import { useMemo } from 'react'
import { TxDataRow, generateDataRowValue } from '../TxDataRow'
import { type SafeTransactionData, type SafeVersion } from '@safe-global/safe-core-sdk-types'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { getDomainHash, getSafeTxMessageHash } from '@/utils/safe-hashes'

export const SafeTxHashDataRow = ({
  safeTxData,
  safeTxHash,
}: {
  safeTxData: SafeTransactionData
  safeTxHash?: string
}) => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const safeVersion = safe.version as SafeVersion

  const computedHash = useMemo(() => {
    if (safeTxHash) return safeTxHash
    if (!safe.version) return
    try {
      return calculateSafeTransactionHash(safeAddress, safeTxData, safe.version, BigInt(safe.chainId))
    } catch {
      return
    }
  }, [safe.chainId, safe.version, safeAddress, safeTxData, safeTxHash])

  const domainHash = getDomainHash({ chainId, safeAddress, safeVersion })
  const messageHash = getSafeTxMessageHash({ safeVersion, safeTxData })

  return (
    <>
      <TxDataRow datatestid="tx-safe-hash" title="safeTxHash:">
        {generateDataRowValue(computedHash, 'hash')}
      </TxDataRow>
      <TxDataRow datatestid="tx-domain-hash" title="Domain hash:">
        {generateDataRowValue(domainHash, 'hash')}
      </TxDataRow>
      {messageHash && (
        <TxDataRow datatestid="tx-message-hash" title="Message hash:">
          {generateDataRowValue(messageHash, 'hash')}
        </TxDataRow>
      )}
    </>
  )
}
