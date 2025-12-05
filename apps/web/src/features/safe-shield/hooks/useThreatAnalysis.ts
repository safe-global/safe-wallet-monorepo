import {
  useThreatAnalysis as useThreatAnalysisUtils,
  useThreatAnalysisHypernative,
} from '@safe-global/utils/features/safe-shield/hooks'
import { useSigner } from '@/hooks/wallets/useWallet'
import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks/useIsHypernativeGuard'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'

export function useThreatAnalysis(
  overrideSafeTx?: SafeTransaction,
  hypernativeAuthToken?: string,
): AsyncResult<ThreatAnalysisResults> | undefined {
  const {
    safe: { chainId, version },
    safeAddress,
  } = useSafeInfo()
  const signer = useSigner()
  const { safeTx, safeMessage, txOrigin } = useContext(SafeTxContext)
  const walletAddress = signer?.address ?? ''
  const { isHypernativeGuard, loading: HNGuardCheckLoading } = useIsHypernativeGuard()

  const blockaidThreatAnalysis = useThreatAnalysisUtils({
    safeAddress: safeAddress as `0x${string}`,
    chainId,
    data: overrideSafeTx || safeTx || safeMessage,
    walletAddress,
    origin: txOrigin,
    safeVersion: version || undefined,
    skip: isHypernativeGuard,
  })

  const hypernativeThreatAnalysis = useThreatAnalysisHypernative({
    safeAddress: safeAddress as `0x${string}`,
    chainId,
    data: overrideSafeTx || safeTx || safeMessage,
    walletAddress,
    origin: txOrigin,
    safeVersion: version || undefined,
    authToken: hypernativeAuthToken,
    skip: !isHypernativeGuard || !hypernativeAuthToken,
  })

  if (HNGuardCheckLoading) {
    return [undefined, undefined, true]
  }

  if (isHypernativeGuard) {
    return hypernativeThreatAnalysis
  }

  return blockaidThreatAnalysis
}
