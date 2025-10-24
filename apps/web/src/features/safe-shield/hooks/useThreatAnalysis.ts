import { useThreatAnalysis as useThreatAnalysisUtils } from '@safe-global/utils/features/safe-shield/hooks'
import { useSigner } from '@/hooks/wallets/useWallet'
import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SafeTransaction } from '@safe-global/types-kit'

export function useThreatAnalysis(overrideSafeTx?: SafeTransaction) {
  const {
    safe: { chainId, version },
    safeAddress,
  } = useSafeInfo()
  const signer = useSigner()
  const { safeTx, safeMessage, txOrigin } = useContext(SafeTxContext)
  const walletAddress = signer?.address ?? ''

  return useThreatAnalysisUtils({
    safeAddress: safeAddress as `0x${string}`,
    chainId,
    data: overrideSafeTx || safeTx || safeMessage,
    walletAddress,
    origin: txOrigin,
    safeVersion: version || undefined,
  })
}
