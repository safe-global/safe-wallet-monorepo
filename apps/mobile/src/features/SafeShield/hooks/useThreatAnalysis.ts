import {
  useThreatAnalysis as useThreatAnalysisUtils,
  useThreatAnalysisWithGuard,
} from '@safe-global/utils/features/safe-shield/hooks'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import type { SafeTransaction } from '@safe-global/types-kit'

export function useThreatAnalysis(overrideSafeTx?: SafeTransaction) {
  const activeSafe = useDefinedActiveSafe()
  const safeAddress = activeSafe.address
  const chainId = activeSafe.chainId
  const { safe } = useSafeInfo()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const walletAddress = activeSigner?.value ?? ''
  const web3ReadOnly = useWeb3ReadOnly()

  const threat = useThreatAnalysisUtils({
    safeAddress: safeAddress as `0x${string}`,
    chainId,
    data: overrideSafeTx,
    walletAddress,
    origin: undefined,
    safeVersion: safe.version || undefined,
  })

  return useThreatAnalysisWithGuard(threat, {
    safeTx: overrideSafeTx,
    safeAddress,
    safeVersion: safe.version,
    web3ReadOnly,
  })
}
