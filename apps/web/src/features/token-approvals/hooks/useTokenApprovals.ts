import { useCallback, useEffect, useState } from 'react'
import type { TokenApproval } from '@safe-global/utils/features/token-approvals/allowances'
import type { RawLog } from '@safe-global/utils/features/token-approvals/approvalHistory'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { logError, Errors } from '@/services/exceptions'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { APPROVALS_SCAN_BATCH_SIZE } from '../constants'

type TokenApprovalsState =
  | { status: 'scanning'; scannedCount: number }
  | { status: 'ready'; approvals: TokenApproval[]; checkedAt: number }
  | { status: 'error' }

// Live allowances for the token/spender pairs in the Safe's history; a rescan re-reads every allowance
const useTokenApprovals = (
  chain: Chain | undefined,
  safeAddress: string,
  isEnabled: boolean,
  batchSize: number = APPROVALS_SCAN_BATCH_SIZE,
): { state: TokenApprovalsState; rescan: () => void } => {
  const [state, setState] = useState<TokenApprovalsState>({ status: 'scanning', scannedCount: 0 })
  const [scanId, setScanId] = useState(0)
  const customRpc = useAppSelector(selectRpc)
  const customRpcUrl = chain ? customRpc[chain.chainId] : undefined

  useEffect(() => {
    if (!isEnabled || !chain) return

    const controller = new AbortController()
    setState({ status: 'scanning', scannedCount: 0 })

    const run = async () => {
      try {
        const { scanApprovalHistory } = await import('../services/approvalHistoryScan')
        const { readTokenApprovals } = await import('@safe-global/utils/features/token-approvals/allowances')
        const provider = await getReadOnlyProvider(chain, customRpcUrl)
        if (!provider) throw new Error(`No RPC for chain ${chain.chainId}`)

        const records = await scanApprovalHistory({
          chainId: chain.chainId,
          safeAddress,
          batchSize,
          signal: controller.signal,
          getTransactionLogs: async (txHash) => {
            const receipt: { logs: RawLog[] } | null = await provider.send('eth_getTransactionReceipt', [txHash])
            return receipt?.logs ?? []
          },
          onProgress: ({ scannedCount }) => {
            if (!controller.signal.aborted) setState({ status: 'scanning', scannedCount })
          },
        })
        const approvals = await readTokenApprovals(provider, safeAddress, records)
        if (!controller.signal.aborted) setState({ status: 'ready', approvals, checkedAt: Date.now() })
      } catch (error) {
        if (controller.signal.aborted) return
        logError(Errors._657, error)
        setState({ status: 'error' })
      }
    }
    run()

    return () => controller.abort()
  }, [chain, customRpcUrl, safeAddress, batchSize, isEnabled, scanId])

  const rescan = useCallback(() => setScanId((id) => id + 1), [])

  return { state, rescan }
}

export default useTokenApprovals
