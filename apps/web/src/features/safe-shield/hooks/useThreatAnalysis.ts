import { useThreatAnalysis as useThreatAnalysisUtils } from '@safe-global/utils/features/safe-shield/hooks'
import { useSigner } from '@/hooks/wallets/useWallet'
import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks/useIsHypernativeGuard'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export function useThreatAnalysis(overrideSafeTx?: SafeTransaction) {
  const {
    safe: { chainId, version },
    safeAddress,
  } = useSafeInfo()
  const signer = useSigner()
  const { safeTx, safeMessage, txOrigin } = useContext(SafeTxContext)
  const walletAddress = signer?.address ?? ''
  const { isHypernativeGuard, loading: HNGuardCheckLoading } = useIsHypernativeGuard()

  const threatAnalysis = useThreatAnalysisUtils({
    safeAddress: safeAddress as `0x${string}`,
    chainId,
    data: overrideSafeTx || safeTx || safeMessage,
    walletAddress,
    origin: txOrigin,
    safeVersion: version || undefined,
  })

  // If HN Guard is installed, return a static INFO status.
  // This is a temporary solution to avoid the error message "Threat analysis failed"
  // when HN Guard is installed.
  if (HNGuardCheckLoading) {
    return [undefined, undefined, true] as AsyncResult<ThreatAnalysisResults>
  }
  if (isHypernativeGuard) {
    return [
      {
        [StatusGroup.THREAT]: [
          {
            severity: Severity.INFO,
            type: ThreatStatus.HYPERNATIVE_GUARD,
            title: 'Threat analysis on Hypernative',
            description: 'The full threat report is available in your Hypernative account',
          },
        ],
      },
      undefined,
      false,
    ] as AsyncResult<ThreatAnalysisResults>
  }

  return threatAnalysis
}
