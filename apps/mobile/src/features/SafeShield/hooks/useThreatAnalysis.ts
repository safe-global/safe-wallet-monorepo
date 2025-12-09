import { useThreatAnalysis as useThreatAnalysisUtils } from '@safe-global/utils/features/safe-shield/hooks'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import type { SafeTransaction } from '@safe-global/types-kit'

export function useThreatAnalysis(overrideSafeTx?: SafeTransaction) {
  const activeSafe = useDefinedActiveSafe()
  const safeAddress = activeSafe.address
  const chainId = activeSafe.chainId
  const { safe } = useSafeInfo()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const walletAddress = activeSigner?.value ?? ''

  return useThreatAnalysisUtils({
    safeAddress: safeAddress as `0x${string}`,
    chainId,
    data: overrideSafeTx,
    walletAddress,
    origin: undefined,
    safeVersion: safe.version || undefined,
  })
}
