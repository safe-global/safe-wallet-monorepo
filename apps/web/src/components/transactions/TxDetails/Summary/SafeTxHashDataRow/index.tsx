import { useMemo } from 'react'
import { Stack } from '@mui/material'
import { TxDataRow, generateDataRowValue } from '../TxDataRow'
import { type SafeTransactionData, type SafeVersion } from '@safe-global/types-kit'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getDomainHash, getSafeTxMessageHash } from '@/utils/safe-hashes'

export const SafeTxHashDataRow = ({
  safeTxData,
  safeTxHash,
}: {
  safeTxData: SafeTransactionData
  safeTxHash?: string
}) => {
  const domainHash = useDomainHash()
  const messageHash = useMessageHash({ safeTxData })
  const computedSafeTxHash = useSafeTxHash({ safeTxData, safeTxHash })

  return (
    <Stack gap={1}>
      <TxDataRow datatestid="tx-domain-hash" title="Domain hash:">
        {generateDataRowValue(domainHash ?? '', 'rawData')}
      </TxDataRow>
      {messageHash && (
        <TxDataRow datatestid="tx-message-hash" title="Message hash:">
          {generateDataRowValue(messageHash, 'rawData')}
        </TxDataRow>
      )}
      <TxDataRow datatestid="tx-safe-hash" title="safeTxHash:">
        {generateDataRowValue(computedSafeTxHash ?? '', 'rawData')}
      </TxDataRow>
    </Stack>
  )
}

export function useDomainHash(): string | null {
  const { safe, safeAddress } = useSafeInfo()

  return useMemo(() => {
    if (!safe.version) {
      return null
    }
    try {
      return getDomainHash({ chainId: safe.chainId, safeAddress, safeVersion: safe.version as SafeVersion })
    } catch {
      return null
    }
  }, [safe.chainId, safe.version, safeAddress])
}

export function useMessageHash({ safeTxData }: { safeTxData: SafeTransactionData }): string | null {
  const { safe } = useSafeInfo()

  return useMemo(() => {
    if (!safe.version) {
      return null
    }
    try {
      return getSafeTxMessageHash({ safeVersion: safe.version as SafeVersion, safeTxData })
    } catch {
      return null
    }
  }, [safe.version, safeTxData])
}

export function useSafeTxHash({
  safeTxData,
  safeTxHash,
}: {
  safeTxData: SafeTransactionData
  safeTxHash?: string
}): string | null {
  const { safe, safeAddress } = useSafeInfo()

  return useMemo(() => {
    if (safeTxHash) {
      return safeTxHash
    }
    if (!safe.version) {
      return null
    }
    try {
      return calculateSafeTransactionHash(safeAddress, safeTxData, safe.version, BigInt(safe.chainId))
    } catch {
      return null
    }
  }, [safeTxData, safe.chainId, safe.version, safeAddress, safeTxHash])
}
