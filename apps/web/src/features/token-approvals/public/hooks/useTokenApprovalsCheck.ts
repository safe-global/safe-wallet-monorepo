import { useMemo } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { formatTimeInWords } from '@safe-global/utils/utils/date'
import type { TokenApprovalItem } from '@safe-global/views/features/token-approvals/components/TokenApprovalsList'
import { useChain } from '@/hooks/useChains'
import useTokenApprovals from '../../hooks/useTokenApprovals'
import { toApprovalItem } from '../../utils/toApprovalItem'

export type TokenApprovalsCheck =
  | { status: 'scanning'; scannedCount: number }
  | { status: 'error'; rescan: () => void }
  | {
      status: 'ready'
      approvals: TokenApprovalItem[]
      unlimitedCount: number
      checkedAtLabel: string
      rescan: () => void
    }

/** The Security Hub's token approvals check for a Safe; undefined while its chain has the flag off */
const useTokenApprovalsCheck = (chainId: string, safeAddress: string): TokenApprovalsCheck | undefined => {
  const chain = useChain(chainId)
  const isEnabled = !!chain && hasFeature(chain, FEATURES.TOKEN_APPROVALS)
  const { state, rescan } = useTokenApprovals(chain, safeAddress, isEnabled)

  return useMemo(() => {
    if (!isEnabled) return undefined
    if (state.status === 'scanning') return state
    if (state.status === 'error') return { status: 'error', rescan }
    return {
      status: 'ready',
      approvals: state.approvals.map((approval) => toApprovalItem(approval, chain)),
      unlimitedCount: state.approvals.filter((approval) => approval.isUnlimited).length,
      checkedAtLabel: formatTimeInWords(state.checkedAt),
      rescan,
    }
  }, [isEnabled, state, rescan, chain])
}

export default useTokenApprovalsCheck
