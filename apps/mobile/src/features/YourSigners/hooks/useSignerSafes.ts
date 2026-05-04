import { useMemo } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllSafes } from '@/src/store/safesSlice'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

interface SignerSafe {
  chainId: string
  safeAddress: string
  overview: SafeOverview
}

export function useSignerSafes(signerAddress: string): SignerSafe[] {
  const safes = useAppSelector(selectAllSafes)

  return useMemo(() => {
    const result: SignerSafe[] = []

    for (const [safeAddress, chains] of Object.entries(safes)) {
      for (const [chainId, overview] of Object.entries(chains)) {
        if (overview.owners.some((o) => sameAddress(o.value, signerAddress))) {
          result.push({ safeAddress, chainId, overview })
        }
      }
    }

    return result
  }, [safes, signerAddress])
}
