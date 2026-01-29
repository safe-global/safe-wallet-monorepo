import { useMemo } from 'react'
import { type SafeTransactionData, type SafeVersion } from '@safe-global/types-kit'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getDomainHash, getSafeTxMessageHash } from '@safe-global/utils/utils/safe-hashes'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

export function useDomainHash(): string | null {
  const { safe, safeAddress } = useSafeInfo()
  const safeSDK = useSafeSDK()

  return useMemo(() => {
    // Try to get version from SDK first, fall back to safe.version
    const version = safeSDK?.getContractVersion() || safe.version
    if (!version) {
      return null
    }
    try {
      return getDomainHash({ chainId: safe.chainId, safeAddress, safeVersion: version as SafeVersion })
    } catch {
      return null
    }
  }, [safe.chainId, safe.version, safeAddress, safeSDK])
}

export function useMessageHash({ safeTxData }: { safeTxData: SafeTransactionData }): string | null {
  const { safe } = useSafeInfo()
  const safeSDK = useSafeSDK()

  return useMemo(() => {
    // Try to get version from SDK first, fall back to safe.version
    const version = safeSDK?.getContractVersion() || safe.version
    if (!version) {
      return null
    }
    try {
      return getSafeTxMessageHash({ safeVersion: version as SafeVersion, safeTxData })
    } catch {
      return null
    }
  }, [safe.version, safeTxData, safeSDK])
}

export function useSafeTxHash({
  safeTxData,
  safeTxHash,
}: {
  safeTxData: SafeTransactionData
  safeTxHash?: string
}): string | null {
  const { safe, safeAddress } = useSafeInfo()
  const safeSDK = useSafeSDK()

  return useMemo(() => {
    if (safeTxHash) {
      return safeTxHash
    }
    // Try to get version from SDK first, fall back to safe.version
    const version = safeSDK?.getContractVersion() || safe.version
    if (!version) {
      return null
    }
    try {
      return calculateSafeTransactionHash(safeAddress, safeTxData, version, BigInt(safe.chainId))
    } catch {
      return null
    }
  }, [safeTxData, safe.chainId, safe.version, safeAddress, safeTxHash, safeSDK])
}
